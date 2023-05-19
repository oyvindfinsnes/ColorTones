class Database {
    static db = null;
    static tableCreationQueries = [
        `
        CREATE TABLE IF NOT EXISTS Source (
            path TEXT NOT NULL PRIMARY KEY,
            name TEXT NOT NULL
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS Playlist (
            plid INTEGER NOT NULL PRIMARY KEY,
            name TEXT NOT NULL
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS Artist (
            name TEXT NOT NULL PRIMARY KEY
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS Album (
            alid INTEGER NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            img TEXT,
            artistname TEXT,
            FOREIGN KEY (artistname) REFERENCES Artist(name)
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS Track (
            filename TEXT NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            alid INTEGER,
            artistname TEXT,
            sourcepath TEXT NOT NULL,
            FOREIGN KEY (alid) REFERENCES Album(alid),
            FOREIGN KEY (artistname) REFERENCES Artist(name),
            FOREIGN KEY (sourcepath) REFERENCES Source(path)
        );
        `,
        `
        CREATE TABLE IF NOT EXISTS PlaylistTrack (
            trackfilename TEXT NOT NULL,
            plid INTEGER NOT NULL,
            FOREIGN KEY (trackfilename) REFERENCES Track(filename),
            FOREIGN KEY (plid) REFERENCES Playlist(plid),
            PRIMARY KEY (trackfilename, plid)
        );
        `
    ];

    static _bulkInsert = (template, valueList) => {
        Database.db.serialize(() => {
            const insertStatement = Database.db.prepare(template);

            for (const values of valueList) {
                if (Array.isArray(values)) {
                    insertStatement.run(...values);
                } else {
                    insertStatement.run(values);
                } 
            };

            insertStatement.finalize();
        });
    }

    // Public Methods =================================================================

    static init = db => {
        Database.db = db;

        Database.run([
            "PRAGMA journal_mode = OFF;",
            "PRAGMA foreign_keys = ON;",
            ...Database.tableCreationQueries
        ]);
    }

    static run = queries => {
        if (Array.isArray(queries)) {
            Database.db.serialize(() => {
                for (const query of queries) {
                    Database.db.run(query);
                }
            });
        } else {
            Database.db.serialize(() => Database.db.run(queries));
        }
    }

    static addSource = (path, name) => {
        Database.run(`INSERT OR IGNORE INTO Source VALUES('${path}', '${name}');`);
    }

    static addPlaylist = name => {
        Database.run(`INSERT INTO Playlist VALUES(NULL, '${name}');`);
    }

    static addArtists = names => {
        Database._bulkInsert("INSERT OR IGNORE INTO Artist VALUES(?);", names);
    }

    static addAlbums = albumData => {
        const values = [];

        for (const albumKey in albumData) {
            const { img, artist } = albumData[albumKey];
            
            const albumName = albumKey.split("%")[1];
            const albumImg = img == undefined ? null : img;

            values.push([null, albumName, albumImg, artist]);
        }

        Database._bulkInsert("INSERT OR IGNORE INTO Album VALUES(?, ?, ?, ?);", values);
    }

    static addTracks = trackData => {
        Database.db.serialize(() => {
            Database.db.all("SELECT alid, name FROM Album", (err, rows) => {
                const values = [];

                for (const data of trackData) {
                    let alid = null;
                    const { filename, name, albumname, artistname, sourcepath } = data;

                    for (const albumData of rows) {
                        if (albumData.name == albumname) {
                            alid = albumData.alid;
                            break;
                        }
                    }

                    values.push([filename, name, alid, artistname, sourcepath]);
                }

                Database._bulkInsert("INSERT OR IGNORE INTO Track VALUES(?, ?, ?, ?, ?);", values);
            });
        });
    }

    static getExternalAlbumData = async (get, join, _artist, _title) => {
        const artist = encodeURIComponent(_artist);
        const title = encodeURIComponent(_title);
        const apikey = "2ba13d8b8ac5635dcdc829f4d4eefe0c";
        const urlBase = "http://ws.audioscrobbler.com/2.0";
        const query = `?method=track.getInfo&api_key=${apikey}&artist=${artist}&track=${title}&format=json`;
        const { track } = await get(join(urlBase, query)).json();
    
        return track;
    };
}

module.exports = { Database };