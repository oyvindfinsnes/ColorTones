const sqlite3 = require("sqlite3");
const path = require("path");
const got = require("got");

class Database {
    constructor(databasePath) {
        this.db = new sqlite3.Database(databasePath);
        this.tableCreationQueries = [
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
                duration REAL NOT NULL,
                normalizedgain REAL NOT NULL,
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

        this._run([
            "PRAGMA journal_mode = OFF;",
            "PRAGMA foreign_keys = ON;",
            ...this.tableCreationQueries
        ]);
    }

    _bulkInsert (template, valueList) {
        this.db.serialize(() => {
            const insertStatement = this.db.prepare(template);

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

    _run(queries) {
        if (Array.isArray(queries)) {
            this.db.serialize(() => {
                for (const query of queries) {
                    this.db.run(query);
                }
            });
        } else {
            this.db.serialize(() => {
                this.db.run(queries);
            });
        }
    }

    // Public Methods =================================================================

    async handleAction(e, action, arg1) {
        if (action == "getSourceItems") {
            return await this.getSourceItems();
        } else if (action == "getDataFromSourcePath", arg1) {
            return await this.getDataFromSourcePath(arg1);
        }
    }

    addSource(path, name) {
        this._run(`INSERT OR IGNORE INTO Source VALUES('${path}', '${name}');`);
    }

    addPlaylist(name) {
        this._run(`INSERT INTO Playlist VALUES(NULL, '${name}');`);
    }

    addArtists(names) {
        this._bulkInsert("INSERT OR IGNORE INTO Artist VALUES(?);", names);
    }

    addAlbums(albumData) {
        const values = [];

        for (const albumKey in albumData) {
            const { img, artist } = albumData[albumKey];
            
            const albumName = albumKey.split("%")[1];
            const albumImg = img == undefined ? null : img;

            values.push([null, albumName, albumImg, artist]);
        }

        this._bulkInsert("INSERT OR IGNORE INTO Album VALUES(?, ?, ?, ?);", values);
    }

    addTracks(trackData) {
        this.db.serialize(() => {
            this.db.all("SELECT alid, name FROM Album", (err, rows) => {
                const values = [];

                for (const data of trackData) {
                    let alid = null;
                    const { filename, name, duration, normalizedgain, albumname, artistname, sourcepath } = data;

                    for (const albumData of rows) {
                        if (albumData.name == albumname) {
                            alid = albumData.alid;
                            break;
                        }
                    }

                    values.push([filename, name, duration, normalizedgain, alid, artistname, sourcepath]);
                }

                this._bulkInsert("INSERT OR IGNORE INTO Track VALUES(?, ?, ?, ?, ?, ?, ?);", values);
            });
        });
    }

    async getExternalAlbumData(_artist, _title) {
        const artist = encodeURIComponent(_artist);
        const title = encodeURIComponent(_title);
        const apikey = "2ba13d8b8ac5635dcdc829f4d4eefe0c";
        const urlBase = "http://ws.audioscrobbler.com/2.0";
        const query = `?method=track.getInfo&api_key=${apikey}&artist=${artist}&track=${title}&format=json`;
        const { track } = await got.get(path.join(urlBase, query)).json();
    
        return track;
    }

    async getSourceItems() {
        return new Promise(res => {
            this.db.serialize(() => {
                this.db.all("SELECT path, name FROM Source", (err, rows) => {
                    res(rows);
                });
            });
        });
    }

    async getDataFromSourcePath(sourcePath) {
        return new Promise(res => {
            this.db.serialize(() => {
                this.db.all(`
                    SELECT
                        Track.filename,
                        Track.name AS title,
                        Track.duration,
                        Track.normalizedgain,
                        Track.artistname AS artist,
                        Album.name AS album,
                        Album.img
                    FROM
                        Track
                    LEFT JOIN
                        Album ON Track.alid = Album.alid
                    WHERE
                        Track.sourcepath LIKE '${sourcePath}'
                `, (err, rows) => {
                    res(rows);
                });
            });
        });
    }
}

module.exports = { Database };
