module.exports = function (app, passport, db, fs) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });
  // isLoggedIn
  // PROFILE SECTION =========================
  app.get('/profile', isLoggedIn, function (req, res) {
    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)

      res.render('profile.ejs', {
        user: req.user,
        messages: result
      })
    })
  });

  app.get('/profile/secret', isLoggedIn, function (req, res) {
    let key = req.originalUrl.slice(20)

    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('secret.ejs', {
        user: req.user,
        messages: result.filter(e => e.key == key)[0]
      })
    })
  });


  app.get('/edit', isLoggedIn, function (req, res) {
    res.render('edit.ejs');
  });

  app.get('/newMemory', isLoggedIn, function (req, res) {
    res.render('newMemory.ejs')

  });

  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================

  app.post('/newMemory', (req, res) => {
    let date = new Date()
    let fileName = req.body.title.match(/[a-z]/gi).join('').toLowerCase()
    let key = Number(req.body.key)
    let text = req.body.text.toLowerCase()
    const a = 'abcdefghijklmnopqrstuvwxyz'
    let cipher = text.split(' ').map((y, i) => y.replace(/[a-z]/g, x => a[(a.indexOf(x) + key + i) % 26])).join(' ')


    fs.copyFile('views/template.ejs', `views/${fileName}.ejs`, (err) => {
      if (err) throw err;
      console.log('source.txt was copied to destination.txt');
    });

    db.collection('messages').insertOne({ title: req.body.title, text: text, key: req.body.key, date: date.toLocaleString(), cipher: cipher, fileName: fileName }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })


  app.get('/profile/:file', isLoggedIn, function (req, res) {

    let file = req.params.file

    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render(`${file}.ejs`, {
        user: req.user,
        messages: result.filter(e => e.fileName == file)[0]
      })
    })
  });



  app.put('/edit', (req, res) => {
    const a = 'abcdefghijklmnopqrstuvwxyz'
    let cipher = req.body.newText.split(' ').map((y, i) => y.replace(/[a-z]/g, x => a[(a.indexOf(x) + req.body.newKey + i) % 26])).join(' ')
    let title = req.body.title.split('+').join(' ')
    console.log('hello', title)
    db.collection('messages').findOneAndUpdate({
      title: title
    }, {
      $set: {
        title: req.body.newTitle,
        text: req.body.newText,
        key: req.body.newKey,
        cipher: cipher

      }
    }, {
      sort: { _id: -1 },
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      res.send(result)
    })

  })

  app.delete('/messages', (req, res) => {

    db.collection('messages').find().toArray((err, result) => {
      if (err) return console.log(err)
      let filename = result.filter(e => e.title == req.body.title)[0].fileName

      fs.unlink(`views/${filename}.ejs`, (err) => {
        if (err) {
          throw err;
        }
        console.log("File is deleted.");
      });
    })


    db.collection('messages').findOneAndDelete({ title: req.body.title }, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
