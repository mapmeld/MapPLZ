// program.js
// Routes to create and fork programs

var Program = require('../models/program');

// POST /program
exports.create = function(req, res, next){
  Program.create({
    name: req.body.sketchname,
    xml: (req.body.xml || ""),
    code: req.body.mysketch
  }, function(err, np){
    if(err){
      return next(err);
    }
    else if(req.body.xml){
      res.json({ id: np.id });
    }
    else{
      if(req.body.basedon){
        // program is considered a fork - load the base program
        Program.get(req.body.basedon, function (err, forkedfrom) {
          if(err){ return next(err); }
          // have the new program "follow" the base program         
          np.follow(forkedfrom, function(err){
            if(err){ return next(err); }
            res.redirect('/program/' + np.id);
          });
        });
      }
      else{
        // program is considered original - redirect to view
        res.redirect('/program/' + np.id);
      }
    }
  });
};

// GET /program/:id
exports.show = function (req, res, next) {
    Program.get(req.params.id, function (err, program) {
        if (err) return next(err);
		// load what program this is based on (if any)
		program.getFollowing(function(err, follows){
			if(err){ return next(err); }
			//return res.json(follows);
			if(follows.length == 1 && follows[0].other == null){
			  	// not based on any other program
        		res.render('program', {
            		program: program,
            		author: "anonymous",
            		follows: null
            	});
			}
			else{
				// display a "based on" message
	        	res.render('program', {
	            	program: program,
	            	author: "anonymous",
	            	follows: follows
	        	});
			}
        });
    });
};

// GET /code-env
// or
// GET /code-env/from/:id
exports.code = function (req, res, next) {
	if(typeof req.params.id == "undefined"){
		// no program defined: load empty text editor
		res.render( 'textcode', { program: null } );
	}
	else{
		// fork this program in the editor
		Program.get(req.params.id, function (err, program) {
			if(err){ return next(err); }
			res.render('textcode', { program: program });
		});
	}
};

// GET /program/history/:id
exports.historyout = function (req, res, next) {
    Program.get(req.params.id, function (err, program) {
        if (err) return next(err);
        program.getPastPrograms(function(err, history){
          if (err) return next(err);
          res.json( history );
        });
    });
};

// GET /program/xml/:id
exports.xmlout = function (req, res, next) {
    Program.get(req.params.id, function (err, program) {
        if (err) return next(err);
        res.json( { xml: (program.xml || "") } );
    });
};