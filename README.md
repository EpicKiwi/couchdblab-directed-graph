# CouchDB Lab : Directed Graph

> CouchDB experiment of graph data storage

## Install

Make sure to have NodeJS installed on your system

Start an instance of CouchDB, you can start a simple server using docker and the following command.

```
docker run --name couchdb -p 5984:5984 -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=admin -d couchdb
```

Install dependancies

```
npm install
```

Copy `settings.example.js` to `settings.js` and fill it with your server configuration

And flush documents using the provided script

```
npm run flush
```

## Dataset

Included dataset is a Game of Thrones graph using data from [the API of Ice And Fire](https://anapioficeandfire.com/).
