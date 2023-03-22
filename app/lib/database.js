const tableCreationQueries = [
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

let db = null;

const _bulkInsert = (template, valueList) => {
    db.serialize(() => {
        const insertStatement = db.prepare(template);

        for (const values of valueList) {
            if (Array.isArray(values)) {
                insertStatement.run(...values);
            } else {
                insertStatement.run(values);
            } 
        };

        insertStatement.finalize();
    });
};

// Public Data =================================================================

const init = async _db => {
    db = _db;

    run([
        "PRAGMA journal_mode = OFF;",
        "PRAGMA foreign_keys = ON;",
        ...tableCreationQueries
    ]);
};

const run = queries => {
    if (Array.isArray(queries)) {
        db.serialize(() => {
            for (const query of queries) {
                db.run(query);
            }
        });
    } else {
        db.serialize(() => {
            db.run(queries);
        });
    }
};

const addSource = (path, name) => {
    run(`INSERT INTO Source VALUES('${path}', '${name}');`);
};

const addPlaylist = name => {
    run(`INSERT INTO Playlist VALUES(NULL, '${name}');`);
};

const addArtists = names => {
    _bulkInsert("INSERT OR IGNORE INTO Artist VALUES(?);", names);
};

const addAlbums = albumDataByArtist => {
    const values = [];

    for (const artistName in albumDataByArtist) {
        for (const albumData of albumDataByArtist[artistName]) {
            const { name, img, artist } = albumData;

            const albumName = name === undefined ? null : name;
            const albumImg = img === undefined ? null : img;

            if (albumName !== null || albumImg !== null) {
                values.push([null, albumName, albumImg, artist]);
            }
        }
    }

    _bulkInsert("INSERT INTO Album VALUES(?, ?, ?, ?);", values);
};

const addTracks = trackData => {
    db.all("SELECT alid, name FROM Album", (err, rows) => {
        const values = [];

        for (const data of trackData) {
            let alid = null;
            const { filename, name, albumname, artistname, sourcepath } = data;

            for (const albumData of rows) {
                if (albumData.name === albumname) {
                    alid = albumData.alid;
                    break;
                }
            }

            values.push([filename, name, alid, artistname, sourcepath]);
        }

        _bulkInsert("INSERT INTO Track VALUES(?, ?, ?, ?, ?);", values);
    });
};

module.exports = { init, run, addSource, addPlaylist, addArtists, addAlbums, addTracks };
