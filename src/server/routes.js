const router = require('express').Router();
const { doesPasswordExist, addEvent } = require('../model/db/events.js')
const { find, addUser } = require('../model/db/users.js')
const { sessionChecker } = require('./middlewares')


// index routes - included here so sessionChecker middle ware won't apply to them
router.get('/', (req, res, next) => {
  return res.render('events/index.ejs', {message:'There\'s a party tonight!'})
})

router.post('/', (req, res, next) => {
  const password = req.body.password
  doesPasswordExist(password)
    .then((event) => {
      if (!event) {
        res.render('events/index.ejs', { message: 'Sorry, were you invited? Try again.'})
      } else {
        console.log(`the party location is ${event.event_location}`)
        return res.render('events/eventRabbit.ejs', {time: event.event_time, location: event.event_location, artists: event.event_artists})
      }
    })
    .catch(console.error)
})

// sign-up route
router.post('/signup', (req, res) => {
  const { email, password } = req.body

  find(email).then(function(user) {
    if (!user) {
      console.log('adding user::', email)
      addUser(email, password)
        .then((newUser) => {
          req.session.email = newUser.email
          console.log(`redirecting to dashboard, req::`, req.session)

          req.session.save(function() {
            res.render('events/dashboard', {username: newUser.email})
          })
        })
        .catch(console.error)
    } else {
      res.render('events/login', {message: 'User already exists, please log in.', loginMessage:""})
    }
  }).catch(console.error)
})

// login routes
router.get('/login', (req, res, next) =>{
  if (req.session.email && req.cookies.user_id) {
    res.redirect('/dashboard')
  } else {
  res.render('events/login', {message:"", loginMessage:""})
  }
})

router.post('/login', (req, res) => {
  const { email, password } = req.body

  find(email).then(function(user) {
    if (!user || password != user.password) {
      res.render('events/login', {loginMessage: 'User not found. Please sign up.', message:""})
    } else {
      console.log('found user::', user.email)
      req.session.email = user.email
      console.log(`redirecting to dashboard, req::`, req.session);

      req.session.save(function() {
        res.render('events/dashboard', {username: user.email})
      })
    }
  }).catch(console.error)
})

// dashboard route
router.get('/dashboard', sessionChecker, (req, res) => {
  res.render('events/dashboard', {username: req.session.email})
})

router.get('/logout', (req, res) => {
  res.clearCookie('user_id')
  res.redirect('/login')
})

// new event routes
router.get('/new', sessionChecker, (req, res, next) => {
  return res.render('events/newEvent.ejs')
})

router.post('/new', (req, res, next) => {
  const {password, time, location, artists} = req.body
  addEvent(password, time, location, artists)
    .then((event) => {
      return res.render('events/thankyou.ejs', {password: event.event_password})
    })
})

router.get('/thankyou', sessionChecker, (req, res, next) => {
  return res.render('events/thankyou', {password: ""})
})

module.exports = router;
