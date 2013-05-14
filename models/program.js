// program.js
// Program model logic (JS and Wiring)

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// constants:

var INDEX_NAME = 'nodes';
var INDEX_KEY = 'type';
var INDEX_VAL = 'program';
var FOLLOWS_REL = 'follows';

// private constructor:

var Program = module.exports = function Program(_node) {
    // all we'll really store is the node; the rest of our properties will be
    // derivable or just pass-through properties (see below).
    this._node = _node;
}

// pass-through node properties:

function proxyProperty(prop, isData) {
    Object.defineProperty(Program.prototype, prop, {
        get: function () {
            if (isData) {
                return this._node.data[prop];
            } else {
                return this._node[prop];
            }
        },
        set: function (value) {
            if (isData) {
                this._node.data[prop] = value;
            } else {
                this._node[prop] = value;
            }
        }
    });
}

proxyProperty('id');
proxyProperty('exists');

proxyProperty('name', true);
proxyProperty('code', true);
proxyProperty('xml', true);

// private instance methods:

Program.prototype._getFollowingRel = function (other, callback) {
    var query = [
        'START program=node({programId}), other=node({otherId})',
        'MATCH (program) -[rel?:FOLLOWS_REL]-> (other)',
        'RETURN rel'
    ].join('\n')
        .replace('FOLLOWS_REL', FOLLOWS_REL);

    var params = {
        programId: this.id,
        otherId: other.id,
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var rel = results[0] && results[0]['rel'];
        callback(null, rel);
    });
};

// public instance methods:

Program.prototype.save = function (callback) {
    this._node.save(function (err) {
        callback(err);
    });
};

Program.prototype.del = function (callback) {
    this._node.del(function (err) {
        callback(err);
    }, true);   // true = yes, force it (delete all relationships)
};

Program.prototype.follow = function (other, callback) {
    this._node.createRelationshipTo(other._node, 'follows', {}, function (err, rel) {
        callback(err);
    });
};

Program.prototype.unfollow = function (other, callback) {
    this._getFollowingRel(other, function (err, rel) {
        if (err) return callback(err);
        if (!rel) return callback(null);
        rel.del(function (err) {
            callback(err);
        });
    });
};

// shortcut to get just the ones this program follows
Program.prototype.getFollowing = function (callback) {
    var query = [
        'START program=node({programId})',
        'MATCH (program) -[rel?:FOLLOWS_REL]-> (other)',
        'RETURN other'
    ].join('\n')
        .replace('INDEX_NAME', INDEX_NAME)
        .replace('INDEX_KEY', INDEX_KEY)
        .replace('INDEX_VAL', INDEX_VAL)
        .replace('FOLLOWS_REL', FOLLOWS_REL);

    var params = {
        programId: this.id,
    };

    var program = this;
    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        for(var i=0;i<results.length;i++){
          if(results[i].other){
            results[i].other.id = results[i].other._data.data.self;
          }
        }
        callback(null, results);
    });
};

// return all programs this program is based on A -[basedon]-> B -[basedon]-> C
Program.prototype.getPastPrograms = function (callback) {
    var query = [
        'START program=node({programId}), other=node:nodes(type="program")',
        'MATCH p = program -[*..15]-> other',
        'RETURN p, other'
    ].join('\n')
        .replace('INDEX_NAME', INDEX_NAME)
        .replace('INDEX_KEY', INDEX_KEY)
        .replace('INDEX_VAL', INDEX_VAL)
        .replace('FOLLOWS_REL', FOLLOWS_REL);

    var params = {
        programId: this.id,
    };

    var program = this;
    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        
        callback(null, results);
    });
};

// calls callback w/ (err, following, others) where following is an array of
// programs this program follows, and others is all other programs minus him/herself.
Program.prototype.getFollowingAndOthers = function (callback) {
    // query all programs and whether we follow each one or not:
    var query = [
        'START program=node({programId}), other=node:INDEX_NAME(INDEX_KEY="INDEX_VAL")',
        'MATCH (program) -[rel?:FOLLOWS_REL]-> (other)',
        'RETURN other, COUNT(rel)'  // COUNT(rel) is a hack for 1 or 0
    ].join('\n')
        .replace('INDEX_NAME', INDEX_NAME)
        .replace('INDEX_KEY', INDEX_KEY)
        .replace('INDEX_VAL', INDEX_VAL)
        .replace('FOLLOWS_REL', FOLLOWS_REL);

    var params = {
        programId: this.id,
    };

    var program = this;
    db.query(query, params, function (err, results) {
        if (err) return callback(err);

        var following = [];
        var others = [];

        for (var i = 0; i < results.length; i++) {
            var other = new Program(results[i]['other']);
            var follows = results[i]['count(rel)'];
                // XXX neo4j bug: returned names are always lowercase!
                // TODO FIXME when updating to the next version of neo4j.

            if (program.id === other.id) {
                continue;
            } else if (follows) {
                following.push(other);
            } else {
                others.push(other);
            }
        }

        callback(null, following, others);
    });
};

// static methods:

Program.get = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, new Program(node));
    });
};

Program.getAll = function (callback) {
    db.getIndexedNodes(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err, nodes) {
        // if (err) return callback(err);
        // XXX FIXME the index might not exist in the beginning, so special-case
        // this error detection. warning: this is super brittle!!
        if (err) return callback(null, []);
        var programs = nodes.map(function (node) {
            return new Program(node);
        });
        callback(null, programs);
    });
};

// creates the program and persists (saves) it to the db, incl. indexing it:
Program.create = function (data, callback) {
    var node = db.createNode(data);
    var program = new Program(node);
    node.save(function (err) {
        if (err) return callback(err);
        node.index(INDEX_NAME, INDEX_KEY, INDEX_VAL, function (err) {
            if (err) return callback(err);
            callback(null, program);
        });
    });
};
