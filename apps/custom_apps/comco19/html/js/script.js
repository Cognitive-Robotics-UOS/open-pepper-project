/** TODO:
 * - Try if Pepper's tablet screen mirroring works (VRLab TV). Chromecast won't
 * work, only thing left to try is to install an android app
 * - Build input field for user/player name on main menu
 * - Store scores with player names/nicknames into a DB that can be shown on
 * another screen
 */

/**
 * IMPORTANT!!!: This code is meant to work on Aldebaran's Pepper robot tablet.
 * It uses Chrome 39 Web browser on Android Lollipop (5.1) with a screen
 * resolution of 962 x 601 pixels (32 bit color depth).
 * Web browser's user agent: Mozilla/5.0 (Linux Android 5.1 LPT 200AR
 * Build/LMY47I) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71
 * Mobile Crosswalk/10.39.235.15 Safari/537.36
 * JavaScript version: 1.7 - ECMAScript 5
 */


// GLOBAL VARIABLES AND CONSTANTS

var WELCOME_SET = [
  'Welcome to Computational Cognition 2019!',
  'I am happy to welcome you to ComCo!',
  'It\'s my pleasure to welcome you to Computational Cognition 2019!',
  'ComCo will be awesome!',
  'Hi! Enjoy this great workshop!',
  'Thanks for coming!',
  'Hello, it\'s good to see you here!',
  'Do you want to take a picture with me?',
  'It is really cool to have you in!',
  'They told me, that my cousin is a toaster.',
  'People say that robots don\'t have feelings. Sometimes that makes me very sad...'
]
var welcomeSet = WELCOME_SET.slice() // Future copy by value of WELCOME_SET

var ROBOT_IP = '198.18.0.1'
var MEDIA_URL = 'http://' + ROBOT_IP + '/apps/.media/'
var AUDIO_PATH = '/home/nao/.local/share/PackageManager/apps/.media/html/'
// Path for the sound if right answer
var RANS_SOUND = 'ding.ogg'
// Path for the sound if wrong answer
var WANS_SOUND = 'tablet_loaded_02.ogg'
var JQUERY_FX = ['toggle', 'fadeToggle', 'slideToggle']
var services
var LIMIT = 15000
var TTSPARAMS = {
  speed: 110.0,
  pitchShift: 1.2,
}
var B_WINNER = 'animations/Stand/Emotions/Positive/Winner_2'
var ANIMLIB = [
  'animations/Stand/Emotions/Neutral/Sneeze',
  'animations/Stand/Emotions/Neutral/AskForAttention_3',
  'animations/Stand/Gestures/BowShort_3',
  'animations/Stand/Waiting/KnockEye_1',
  'animations/Stand/Waiting/LoveYou_1',
  'animations/Stand/Waiting/MysticalPower_1',
  'animations/Stand/Waiting/ShowMuscles_4',
  'animations/Stand/Waiting/SpaceShuttle_1',
  'animations/Stand/Waiting/TakePicture_1',
  'animations/Stand/Waiting/Zombie_1',
  'animations/Stand/Waiting/DriveCar_1',
  'animations/Stand/Waiting/CallSomeone_1',
  'animations/Stand/Waiting/AirGuitar_1',
  'animations/Stand/Reactions/ShakeBody_1',
  'animations/Stand/Waiting/Helicopter_1'
]
var animLib = ANIMLIB.slice()
var services
var qSession
// CLASSES
/** Class representing the services of the current QiSession.
 * @param {QiSession} session - Current QiSession
 */
function Services(session) {
  this.memory = session.service('ALMemory')
  this.tts = session.service('ALTextToSpeech')
  this.aSay = session.service('ALAnimatedSpeech')
  this.tablet = session.service('ALTabletService')
  this.aPlayer = session.service('ALAudioPlayer')
  this.vPlayer = session.service('ALAudioPlayer')
  this.behavior = session.service('ALBehaviorManager')
  this.posture = session.service('ALRobotPosture')
}


// FUNCTIONS

/**
 * Restart all the constants defined as arrays copying by value since they
 * may run out of elements after removing the picked up elements.
 */
function restartConstantsArrays() {
  welcomeSet = WELCOME_SET.slice()
}


/**
 * Make Pepper speak out the text string we sent. Use 'ALAnimatedSpeech' for
 * contextually using a set of randomized gestures while speaking.
 * @param {string} text - Text message Pepper will speak out
 * @param {boolean} animated - Tell if animated say or just say
 */
function speakOut(text, animated) {
  if (animated === undefined) animated = true
  if (animated) {
    var configuration = {
      'bodyLanguageMode': 'contextual',
    }
    services.aSay.then(function(tts) {
      tts.say(text, configuration)
    })
  } else {
    services.tts.then(function(tts) {
      tts.say(text)
    })
  }
}


/**
 * Make Pepper launch a behavior given its name
 * @param {string} bName - Behavior name installed on Pepper (full path name)
 */
function launchBehavior(bName) {
  services.behavior.then(function(behavior) {
    return behavior.startBehavior(bName)
  })
}


/**
 * Play a sound file from the given path.
 * @param {string} fname - Absolute path of the sound that will be played
 */
function playSound(fname) {
  try {
    services.aPlayer.then(function(ap) {
      ap.playFile(fname)
    })
  } catch (err) {
    console.log(err.message) // Print the error on a JS console
  }
}


/**
 * Shuffle the elements of a given array, return the shuffled array.
 * @param {Array} arr - Given array
 * @return {Array} - Shuffled array
 */
function shuffleArray(arr) {
  var j
  var x
  var i
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = arr[i]
    arr[i] = arr[j]
    arr[j] = x
  }
  return arr
}


/**
 * Show the current question and its answers with a random effect.
 * @param {string} fx - Picked effect from the list JQUERY_FX
 */
function openingFX(fx) {
  switch (fx) {
    case 'toggle':
      $('#quiz').show('fast')
      break
    case 'fadeToggle':
      $('#quiz').fadeIn('fast')
      break
    case 'slideToggle':
      $('#quiz').slideDown('fast')
      break
  }
}


/**
 * Hide the current question and its answers with a random effect.
 * @param {string} fx - Picked effect from the list JQUERY_FX
 * @return {function} - Effect chosen
 */
function closingFX(fx) {
  switch (fx) {
    case 'toggle':
      return $('#quiz').hide('fast')
      break
    case 'fadeToggle':
      return $('#quiz').fadeOut('fast')
      break
    case 'slideToggle':
      return $('#quiz').slideUp('fast')
      break
  }
}


/** Tell a random joke from the list. */
function tellJoke() {
  var joke = randomPick(jokes)
  if (typeof joke === 'undefined') { // If there are no jokes left
    jokes = JOKES.slice() // Copy again the array elements by value
    joke = randomPick(jokes) // Pick a joke
  }
  speakOut(joke) // Make Pepper tell the chosen joke
}


/**
 * Pick a random element of a given array and delete it afterwards.
 * @param {Array} arr - Given array
 * @return {Object} - Randomly-picked element of the array
 */
function randomPick(arr) {
  // Pick a random element index between 0 and arr.length - 1
  var rnd = Math.floor((Math.random() * arr.length))
  var picked = arr[rnd] // Store the value of the index picked from this array
  arr.splice(rnd, 1) // Remove the picked element and reindex the array
  return picked
}

/** Go back to the initial posture. */
function initialPosture() {
  services.posture.then(function(posture) {
    posture.applyPosture('StandInit', 0.5)
  })
}


/** TTS' current sentence.
 * @param {string} sentence - Current sentence
 */
function currentSentence(sentence) {
  if (sentence) console.log('Current sentence: ' + sentence)
}

/**
 * Subscribe the event "ALTextToSpeech/Status" to the function
 * "talkingStatus", so that every time Pepper's TTS status changes, the function
 * is called.
 */
function subscribePeopleDetected() {
  // try {
  //   services.memory.then(function(memory) {
  //     memory.subscriber('PeoplePerception/PopulationUpdated').then(function(evt) {
  //         // evt.signal.connect(greetHuman)
  //         evt.signal.connect(greeetHuman).done(function(data) {
  //           console.log(data)
  //           console.log('IN!')
  //         })
  //     })
  //   })
  // } catch (err) {
  //   console.log(err.message) // Print the error on a JS console
  // }
  session.service("ALMemory").then(function (ALMemory) {
  ALMemory.subscriber("PeoplePerception/JustArrived").then(function (subscriber) {
    // subscriber.signal is a signal associated to "FrontTactilTouched"
    subscriber.signal.connect(greetHuman)
  });
});
}

var timer = null;

function greetHuman() {
  console.log('Enter!!!');
  if( !timer ) {

    var greeting = randomPick(welcomeSet)
    if (typeof greeting === 'undefined') { // If there are no greetings left
      welcomeSet = WELCOME_SET.slice() // Copy again the array elements by value
      greeting = randomPick(welcomeSet) // Pick a greeting
    }
    console.log( greeting )
    speakOut(greeting) // Make Pepper greet a person
    // timer = true;
    // window.setTimeout(function() { timer = null; }, 10*1000);
  }
}


/**
 * Subscribe the event "ALTextToSpeech/Status" to the function
 * "talkingStatus", so that every time Pepper's TTS status changes, the function
 * is called.
 */
function subscribeTalkingStatus() {
  try {
    services.memory.then(function(memory) {
      memory.subscriber('ALTextToSpeech/Status').then(function(evt) {
        evt.signal.connect(talkingStatus)
      })
    })
  } catch (err) {
    console.log(err.message) // Print the error on a JS console
  }
}

/** Pepper's talking status. Control the flow of the game.
 * @param {Array} value - List containing the current TTS task id and status
 */
function talkingStatus() {
  console.log('IN TALKINGSTATUS')
}


/**
 * Stop the TTS service.
 */
function stopTTS() {
  services.tts.then(function(tts) {
    tts.stopAll()
  })
}


/**
 * Subscribe the event "ALTextToSpeech/Status" to the function
 * "talkingStatus", so that every time Pepper's TTS status changes, the function
 * is called.
 */
function subscribeCurrentSentence() {
  try {
    session.service('ALMemory').then(function(memory) {
      memory.subscriber('ALTextToSpeech/CurrentSentence').then(function(evt) {
        evt.signal.connect(currentSentence)
      })
    })
  } catch (err) {
    // console.log(err.message) // Print the error on a JS console
  }
}


/** Display a video or an image (also GIFs) depending on the given media.
 * @param {string} fname - File name
 */
function displayMedia(fname) {
  var extension = fname.slice(fname.length - 3, fname.length)
  // var path = '/home/nao/media/' + fname // only works for audio files
  var path = MEDIA_URL + fname
  cStatus.media.url = path
  if (extension === 'mp4') {
    services.tablet.then(function(tablet) {
      tablet.playVideo(path)
      cStatus.media.type = 'video'
    })
  } else { // else if (extension === 'gif' || extension === 'png')
    services.tablet.then(function(tablet) {
      tablet.showImageNoCache(path)
      cStatus.media.type = 'image'
    })
  }
}


/** Stop a video or hide an image depending what media is displayed. */
function hideMedia() {
  if (cStatus.media.type === 'video') {
    services.tablet.then(function(tablet) {
      tablet.stopVideo()
    })
  } else {
    services.tablet.then(function(tablet) {
      tablet.hideImage()
    })
  }
}


/** Set the language of the TTS. */
function setLanguage() {
  services.tts.then(function(tts) {
    if (game.german) tts.setLanguage('German')
    else tts.setLanguage('English')
  })
}


/** Set the TTS parameters. */
function setLangParams() {
  services.tts.then(function(tts) {
    if (game.german) {
      tts.setParameter('pitchShift', TTSPARAMS.pitchShift)
      tts.setParameter('speed', TTSPARAMS.speed)
    }
  })
}


/** Randomly select a specific number of questions from the quiz.
 * @param {Array.Object.<string, string|Array.string>} qList - The whole quiz
 * @param {number} total - Number of random questions to select
 * @param {boolean} german - Tell if german quiz or not
 * @return {Array.Object.<string, string|Array.string>}
 */
function selectQuestions(qList, total, german) {
  var picked = []
  for (var i = 0; i < total; i++) picked.push(randomPick(qList))
  return picked
}


/** Add a click event listener for each possible answer */
function addClickListeners() {
  $('#bg-1').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'))
    }
  })
  $('#bg-2').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'))
    }
  })
  $('#bg-3').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'))
    }
  })
  $('#bg-4').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'))
    }
  })
}


// Once the document is loaded/ready do different stuff
$(document).ready(function() {
  qSession = new QiSession()
  session = new QiSession()
  services = new Services(qSession)
  $('#close-app').on('click', function() {
    services.behavior.then(function(behavior) {
      services.memory.then(function(memory) {
        memory.getData('packageUid').then(function(uid) {
          var packageUid = uid
          // behavior.stopBehavior("digitalisierung-quiz/quiz")
          // Get the package UID previously stored in memory
          behavior.stopBehavior(packageUid + '/quiz')
        })
      })
    })
  })
  //subscribeTalkingStatus()
  // subscribeCurrentSentence()
  subscribePeopleDetected()
  console.log( 'Event Assigned' );
})
