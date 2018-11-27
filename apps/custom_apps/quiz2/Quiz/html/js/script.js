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
 * Web browser's user agent: Mozilla/5.0 (Linux; Android 5.1; LPT 200AR
 * Build/LMY47I) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71
 * Mobile Crosswalk/10.39.235.15 Safari/537.36
 * JavaScript version: 1.7 - ECMAScript 5
 */


// GLOBAL VARIABLES AND CONSTANTS
var qSession;
var game;
var cStatus;
var QUIZZES = {
  cogsci: 'cogsci.tsv',
  ibm: 'ibm.tsv',
  deutsch: 'deutsch.tsv',
  digitalisierung: 'digitalisierung.tsv',
};
var NQUESTIONS = 5;
var GENERAL_INFO = 'I am Lou, a humanoid robot. You probably know me as Pepper,\
                    but that is just my model name. I was first introduced by \
                    Softbank Robotics in 2015. I was designed to be great at \
                    interacting with humans, thus I can recognize faces, reed \
                    people\'s emotions and have a little chat with them. Many \
                    Peppers all across the world are being used as robotic \
                    employees in restaurants, banks, offices, and medical \
                    facilities. Or they are, like me, used to research \
                    human-robot-interaction and cognitive robotics at schools \
                    and universities.';
var TECHNICAL_INFO = 'I am 120 centimeters tall and 28 kilograms heavy. I can \
                      use the 2 cameras and 4 microphones on my head to \
                      experience my surroundings in 3 dimensions. I get easily \
                      confused in busy environments though, that\'s why you \
                      mostly have to interact with me through the 10 inch \
                      touchscreen tablet on my chest. I have touch sensors on \
                      my head and arms as well as gyro sensors in my chest and \
                      legs. The sonar, laser, and bumper sensors in my legs \
                      help me navigate. I\'m not supposed to move around right \
                      now but if I was allowed to, I could move with a speed \
                      of up to 3 kilometers per hour.';
var SP_INFO = 'Thanks for being interested in me and the humans who work on \
               me! I\'ve been with the Cognitive Science students in \
               Osnabrueck since August 2017. Last year, my humans trained me \
               as part of the Cognitive Robotics study project to become a \
               neuroscience tutor. This semester, their goals have broadened \
               even more: They\'re working very hard to make me have small \
               talk with you humans in a natural way. Hopefully, I can then \
               act as a university guide to new students soon. This will \
               include giving them directions, teaching them about the \
               university and Cognitive Science and of course entertaining \
               them with games and magic tricks!';
var INTRO = 'Hi Human, I am Lou, from the Institute of Cognitive Science at \
             Osnabrueck University. Usually, I am happy to listen to all the \
             things you say. But at the moment, I can\'t hear you. There is \
             just too much going and I can\'t follow conversations as good as \
             you humans can. So for now, you have to use the touch screen \
             while I do the talking. I will ask you five questions about \
             cognitive science, IBM, and cognitive computing. Lets see if you \
             are as smart as Watson. Have fun and good luck!';
var INTROD = 'Guten Tag! Ich bin Lou, der Roboter des Instituts für \
              Kognitionswissenschaft der Universität Osnabrück. Normalerweise \
              rede ich gerne direkt mit Menschen, aber derzeit habe ich leider \
              eine Mittelohrentzündung, sodass ich Sie nicht verstehen kann. \
              Nutzen Sie doch stattdessen einfach den Bildschirm auf meiner \
              Brust. Die Fragen, die Sie dort beantworten können, stammen vom \
              Gesundheitscampus Osnabrück. Zu Risiken und Nebenwirkungen lesen \
              Sie die Packungsbeilage und fragen Sie Ihren Arzt oder \
              Apotheker.';
var INTRODD = 'Guten Tag! Ich bin Lou, der Roboter des Instituts für \
              Kognitionswissenschaft der Universität Osnabrück. Normalerweise \
              rede ich gerne direkt mit Menschen, aber derzeit habe ich leider \
              eine Mittelohrentzündung, sodass ich Sie nicht verstehen kann. \
              Nutzen Sie doch stattdessen einfach den Bildschirm auf meiner \
              Brust. Zu Risiken und Nebenwirkungen lesen Sie die \
              Packungsbeilage und fragen Sie Ihren Arzt oder Apotheker.';
var RIGHT_INTRO = [
  'The right answer is',
  'The correct answer is',
  'Actually the answer is',
];
var rightIntro = RIGHT_INTRO.slice();
var NEXT_QUESTION = [
  'Ok, get ready for the next question',
  'Next question is coming up',
  'The next question is:',
  'Can you answer the following',
  'Ready for the next question you should be',
  'Do you know this?',
  'Next question',
];
var NEXT_QUESTIOND = [
  'Ok, bereit für die nächste Frage?',
  'Hier kommt die nächste Frage',
  'Die nächste Frage lautet',
  'Können Sie folgendes beantworten?',
  'Sind Sie bereit für die nächste Frage?',
  'Wissen Sie das hier?',
  'Nächste Frage',
];
var nextQuestion = NEXT_QUESTION.slice();
var nextQuestionD = NEXT_QUESTIOND.slice();
var CONGRATS = [
  'Congratulations, you finished the quiz',
  'Awesome, you finished the quiz',
  'Great Work, you finished the quiz.',
  'Congratulations, you mastered this quiz',
  'That was fun! You finished this quiz',
];
var CONGRATSD = [
  'Gratulation, Sie haben das Quiz beendet',
  'Klasse, Sie haben das Quiz beendet.',
  'Gute Arbeit, Sie haben das Quiz beendet.',
  'Gratuliere, Sie haben das Quiz gemeistert',
  'Das war spaßig! Sie haben dieses Quiz geschafft',
];
var congrats = CONGRATS.slice();
var congratsD = CONGRATSD.slice();
var CONGRATS_5 = [
  'And you achieved a perfect score! Five out of five questions were correct. \
   If you want to learn even more,talk to my humans!',
  'You answered everything correctly. Five out of five questions were right. \
   You are the perfect candidate for our study program',
  'And you achieved a perfect score! Five out of five questions were correct. \
   We Robots really have to evolve a lot to achieve your level of \
   intelligence!',
  'You answered everything correctly. Five out of five questions were right. \
   Do you know Watson? He is a great quiz champion, just like you. Maybe you \
   should meet some time and talk about strategies',
  'Five out of Five, that is really impressive. Did you got help by Watson or \
   did you achieve this perfect score by yourself?',
];
var CONGRATS_5D = [
  'Und Sie haben die volle Punktzahl! Wenn Sie noch mehr erfahren wollen, \
   sprechen Sie einfach meine Menschen an.',
  'Sie haben alles richtig beantwortet, Sie sollten Pharmazie studieren.',
  'Sie haben alles richtig beantwortet. Wir Roboter müssen wirklich noch viel \
   lernen, ehe wir Ihr Level an Intelligenz erreichen!',
  'Sie haben fünf der fünf Fragen richtig beantwortet. Kennen Sie IBM Watson? \
   Er ist ein grandioser Quizspieler, genau wie Sie. Vielleicht sollten Sie \
   beide sich einmal treffen und Strategien austauschen?',
  'Fünf von fünf, haben Sie das Quiz selber geschrieben?',
];
var congrats5 = CONGRATS_5.slice();
var congrats5D = CONGRATS_5D.slice();
var CONGRATS_4 = [
  'You answered four questions correctly. That\'s a great result! If you have \
   open questions, you can talk to my humans',
  'Four correct answers, that is fantastic! If you have open questions, you \
   can talk to my humans',
  'Four correct answers, that is fantastic! You are a great candidate for our \
   study program',
  'You answered four questions correctly. You are nearly as good as Watson \
   himself',
];
var CONGRATS_4D = [
  'Sie haben vier Fragen richtig beantwortet. Das ist ein sehr gutes Ergebnis! \
   Wenn Sie noch Fragen haben, können sie sich an meine Menschen wenden',
  'Vier richtige Antworten, fantastisch! Wenn Sie noch Fragen haben, können \
   sie sich an meine Menschen wenden',
  'Vier richtige Antworten! Sie könnten sicherlich Pharmazie studieren. Wenn \
   Sie noch Fragen haben, können sie sich an meine Menschen wenden',
  'Sie hatten vier der fünf Fragen richtig. Sie sind fast so gut, als hätten \
   Sie das Quiz selber geschrieben',
];
var congrats4 = CONGRATS_4.slice();
var congrats4D = CONGRATS_4D.slice();
var CONGRATS_3 = [
  'You answered three out of the five questions correctly. That\'s a great \
   start. If you have more questions, you \
   can talk to my humans.',
  'Three of the five questions were correct. Maybe you should ask Watson for \
   help next time.',
  'Three right answers, you did a great job. If you have more questions, you \
   can talk to my humans.',
  'Three of the five questions were correct. Do you want to play again?',
];
var CONGRATS_3D = [
  'Sie haben drei Fragen richtig beantwortet, ganz gut für den Anfang.',
  'Drei der fünf Antworten waren richtig. Vielleicht sollten Sie nächstes Mal \
   einen Apotheker um Hilfe bitten.',
  'Drei richtige Antworten, gut gemacht. Bei weiteren Fragen wenden Sie sich \
   einfach an meine Menschen.',
  'Drei der fünf Antworten waren korrekt. Wollen Sie noch einmal spielen?',
];
var CONGRATS_3DD = [
  'Sie haben drei Fragen richtig beantwortet, ganz gut für den Anfang.',
  'Drei der drei Antworten waren richtig. Sehr gut gemacht!',
  'Drei richtige Antworten, gut gemacht. Bei weiteren Fragen wenden Sie sich \
   einfach an meine Menschen.',
  'Drei der drei Antworten waren korrekt. Sehr gut!',
];
var congrats3 = CONGRATS_3.slice();
var congrats3D = CONGRATS_3D.slice();
var congrats3DD = CONGRATS_3DD.slice();
var CONGRATS_2 = [
  'You answered two questions correctly, better luck next time. Maybe you \
   should have asked Watson for help',
  'You had two answers correct. Maybe you should have asked Watson for help',
  'You answered two questions correctly. I am sure, next time you will win \
   this thing',
];
var CONGRATS_2D = [
  'Sie haben zwei Fragen richtig beantwortet, vielleicht haben Sie ja nächstes \
   Mal mehr Glück.',
  'Sie hatten zwei richtige Antworten. Vielleicht hätten Sie besser einen \
   Apotheker um Hilfe gebeten',
  'Sie haben zwei Fragen richtig beantwortet. Ich bin mir sicher, dass Sie \
   nächstes Mal alle schaffen',
];
var congrats2 = CONGRATS_2.slice();
var congrats2D = CONGRATS_2D.slice();
var CONGRATS_1 = [
  'Only one answer was correct. Maybe you should have asked Watson for help',
  'Only one answer was correct. Better luck next time. If you have questions, \
   you can ask to my humans.',
  'Unfortunately you only answered one question correctly. But luckily I am an \
   emotional support robot and I can cheer you right up: You are great and I \
   bet you know a lot of other things',
  'Unfortunately you only answered one question correctly. I will tell you a \
   Joke to cheer you up: Three statisticians go hunting for deer. They spot \
   one off in the distance. The first one shoots about a meter too high, the \
   second one, about a meter too low, the third one yells, We got it!',
];
var CONGRATS_1D = [
  'Nur eine richtige Antwort. Vielleicht hätten Sie besser einen Apotheker um \
   Hilfe gebeten.',
  'Nur eine richtige Antwort. Vielleicht haben Sie nächstes Mal ja mehr Glück?',
  'Leider haben Sie nur eine Frage richtig beantwortet. Zum Glück bin ich ein \
   Roboter für emotionale Unterstützung und kann Sie gleich wieder aufmuntern: \
   Sie sind toll und ich wette, dass Sie eine Menge anderer Dinge wissen!',
  'Leider haben Sie nur eine Frage richtig beantwortet. Ein Witz zur \
   Aufmunterung: Drei Statistiker gehen jagen. Bald sehen sie ein Reh am \
   Waldrand. Der erste schießt, aber einen Meter zu hoch. Der zweite versucht \
   sein Glück, trifft aber einen Meter zu tief. Der dritte ruft: Wir haben es \
   erwischt!',
];
var congrats1 = CONGRATS_1.slice();
var congrats1D = CONGRATS_1D.slice();
var CONGRATS_0 = [
  'You did not answer the questions correctly. If you want to learn more, you \
   can talk to my humans',
  'But maybe you did not understood the game. You were supposed to select the \
   correct answers, not the wrong one',
  'Non of the answers were correct. But we can\'t all be Watsons. I hope the \
   next time you\'ll have better luck',
  'Unfortunately you didn\'t answer correctly. But luckily I am an emotional \
   support robot and I can cheer you right up: You are great and I bet you \
   know a lot of other things',
];
var CONGRATS_0D = [
  'Sie haben die Fragen leider falsch beantwortet. Wenn Sie Fragen haben, \
   wenden Sie sich doch einfach an meine Menschen.',
  'Vielleicht haben Sie das Spiel falsch verstanden: Sie sollen die richtige \
   Antwort auswählen, nicht die falschen...',
  'Keine der Antworten war richtig, aber wir können ja nicht alle Einstein \
   sein. Vielleicht haben Sie beim nächsten Mal ja mehr Glück.',
  'Leider haben Sie keine Frage richtig beantwortet. Zum Glück bin ich ein \
   Roboter für emotionale Unterstützung und kann Sie gleich wieder aufmuntern: \
   Sie sind toll und ich wette, dass Sie eine Menge anderer Dinge wissen!',
];
var congrats0 = CONGRATS_0.slice();
var congrats0D = CONGRATS_0D.slice();
// Set of jokes to use after a certain period if the user is not answering
var JOKES = [
  'I didn\'t think the question would be that difficult, human...',
  'Should I lower the difficulty, noob?',
  'Tick-tock, time is running!',
  'If you take this long, my battery will run out soon...',
  'Hey, are you still there?',
  'Anyone still there?',
  'Do you need some time on Yahoo Answers to figure my question out?',
  'If you don\'t know, you could ask Siri for help...',
  'Do you need help from Watson?',
  'Do you need help from Google Assistant?',
  'Hey, what\'s with the silent treatment, human?',
  'Hey, what\'s with the silent treatment?',
  'Did I steal your breath away or is the question just too hard?',
];
var jokes = JOKES.slice(); // Future copy by value of JOKES
// Set of positive feedback reactions in case of right answer
var RIGHT_SET = [
  'Well done! This is the right answer!',
  'Well done!',
  'Good choice! You’re quite clever.',
  'Exactly! You picked the right answer!',
  'Excellent! You are doing great!',
  'Good job! You made the right choice!',
  'Good job!',
  'Great! This is correct!',
  'Awesome! That’s true!',
  'Perfect!',
  'You are completely right!',
  'Nice! I love doing this quiz with you!',
];
var rightSet = RIGHT_SET.slice(); // Future copy by value of RIGHT_SET
// Set of negative feedback reactions in case of wrong answer
var WRONG_SET = [
  'Sorry, this is incorrect.',
  'Too bad, that wasn’t the correct answer.',
  'What a pity! Next time you’ll do better.',
  'I\'m afraid this is the wrong answer.',
  'That’s incorrect but I know you can do better!',
  'Too bad, you didn’t choose correctly. More luck with the next question!',
  'Sadly this is wrong, but learning new things is also fun, right?',
  'This was a close one! More luck next time.',
  'I\'m sorry, this is not the right answer.',
  'I\'m afraid you made the wrong choice. Cheer up! I know you can do better!',
  'Oh, this is not correct. But keep going, I’m sure you know the next one!',
];
var wrongSet = WRONG_SET.slice(); // Future copy by value of WRONG_SET
var ROBOT_IP = '198.18.0.1';
var MEDIA_URL = 'http://' + ROBOT_IP + '/apps/.media/';
var AUDIO_PATH = '/home/nao/.local/share/PackageManager/apps/.media/html/';
// Path for the sound if right answer
var RANS_SOUND = 'ding.ogg';
// Path for the sound if wrong answer
var WANS_SOUND = 'tablet_loaded_02.ogg';
var JQUERY_FX = ['toggle', 'fadeToggle', 'slideToggle'];
var services;
var quizzes = {}; // same as var object = new Object();
var storedQuizzes = {};
var LIMIT = 15000;
var TTSPARAMS = {
  speed: 110.0,
  pitchShift: 1.2,
};
var B_WINNER = 'animations/Stand/Emotions/Positive/Winner_2';
// Options: QUIZZES.cogsci, QUIZZES.deutsch, QUIZZES.ibm
var chosenQuiz;


// CLASSES
/** Class representing the services of the current QiSession.
 * @param {QiSession} session - Current QiSession
 */
function Services(session) {
  this.memory = session.service('ALMemory');
  this.tts = session.service('ALTextToSpeech');
  this.aSay = session.service('ALAnimatedSpeech');
  this.tablet = session.service('ALTabletService');
  this.aPlayer = session.service('ALAudioPlayer');
  this.vPlayer = session.service('ALAudioPlayer');
  this.behavior = session.service('ALBehaviorManager');
}


/** Class representing a player.
 * @param {string} name - Player's name
 */
function Player(name) {
  this.name = name;
  this.score = 0;
  this.setName = function(newName) {
    this.name = newName;
  };
  this.setScore = function(newScore) {
    this.score = newScore;
  };
}


/** Class representing a game.
 * @param {Player} player - Player object containing its name and score
 * @param {Array.Object.<string, string>} qList - Whole processed quiz
 * @param {boolean} german - Tell if quiz is german or not
 */
function Game(player, qList, german) {
  this.player = player;
  this.quiz = qList;
  this.nQuestions = this.quiz.length;
  this.german = german;
  // "p" as a short for position of the current question on the game
  this.p = 0;
  this.elapsedTime = function() {
    var totalElapsed = 0;
    for (var i = 0; i < this.nQuestions; i++) {
      totalElapsed += this.quiz[i].eTime;
    }
    return totalElapsed;
  };
  this.nCorrect = function() {
    var correct = 0;
    for (var i = 0; i < this.nQuestions; i++) {
      if (this.quiz[i].correct) correct += 1;
    }
    return correct;
  };
  this.completed = false;
}


/** Class representing the TTS and media status for the current question */
function CurrentStatus() {
  this.speaking = false;
  this.question = {
    id: undefined,
    spoken: false,
  };
  this.feedback = {
    id: undefined,
    spoken: false,
  };
  this.story = {
    id: undefined,
    spoken: false,
  };
  this.media = {
    url: undefined,
    type: undefined,
    shown: false,
  };
  this.congrats = {
    id: undefined,
    spoken: false,
  };
  this.about = false;
}


// FUNCTIONS
/** Add a click event listener for each possible menu item */
function menuClickListeners() {
  $('#cogsci').on('click', function() {
    chosenQuiz = QUIZZES.cogsci;
    startGame();
  });
  // $('#ibm').on('click', function() {
  //   chosenQuiz = QUIZZES.ibm;
  //   startGame();
  // });
  $('#digitalisierung').on('click', function() {
    chosenQuiz = QUIZZES.digitalisierung;
    startGame();
  });
  $('#deutsch').on('click', function() {
    chosenQuiz = QUIZZES.deutsch;
    startGame();
  });
  $('#about').on('click', function() {
    services.tts.then(function(tts) {
      tts.setLanguage('English');
    });
    chosenQuiz = QUIZZES.about;
    $('#menu').hide('slow');
    $('#about-me').show('fast');
    cStatus.about = true;
  });
}


/** Start the game loading the quiz and the first questtion and its answers when
 * a menu item is clicked.
 */
function startGame() {
  $('#menu').hide('slow');
  var selectedQs;
  var german;
  switch (chosenQuiz) {
    case 'cogsci.tsv':
      if (quizzes.cogsci.length < NQUESTIONS) {
        quizzes.cogsci = JSON.parse(JSON.stringify(storedQuizzes.cogsci));
      }
      german = false;
      selectedQs = selectQuestions(quizzes.cogsci, NQUESTIONS, german);
      break;
    case 'ibm.tsv':
      if (quizzes.ibm.length < NQUESTIONS) {
        quizzes.ibm = JSON.parse(JSON.stringify(storedQuizzes.ibm));
      }
      german = false;
      selectedQs = selectQuestions(quizzes.ibm, NQUESTIONS, german);
      break;
    case 'digitalisierung.tsv':
      if (quizzes.digitalisierung.length < NQUESTIONS - 2) {
        quizzes.digitalisierung = JSON.parse(JSON.stringify(storedQuizzes.digitalisierung));
      }
      german = true;
      selectedQs = selectQuestions(quizzes.digitalisierung, 3, german);
      break;
    case 'deutsch.tsv':
      if (quizzes.deutsch.length < NQUESTIONS) {
        quizzes.deutsch = JSON.parse(JSON.stringify(storedQuizzes.deutsch));
      }
      german = true;
      selectedQs = selectQuestions(quizzes.deutsch, NQUESTIONS, german);
      break;
    default:
  }
  player = undefined;
  player = new Player();
  game = undefined;
  game = new Game(player, selectedQs, german);
  restartConstantsArrays();
  cStatus = undefined;
  if (game.german) {
    $('#question-tag').html('Frage ');
    $('#of-tag').html(' von ');
  }
  cStatus = new CurrentStatus();
  if (!game.german) {
    $('#header').attr('src', MEDIA_URL + 'cogsci-ibm.png');
    $('#question-tag').html('Question ');
    $('#of-tag').html(' of ');
  }
  else if (chosenQuiz == QUIZZES.digitalisierung) {
    $('#header').attr('src', MEDIA_URL + 'digitalisierung-header.png');
  }
  else $('#header').attr('src', MEDIA_URL + 'ghcampus-header.png');
  setLanguage();
  setLangParams();
  // Add click event listeners
  addClickListeners();
  $('#game').show('fast').promise().done(function() {
    if (!game.german) {
      speakOut(INTRO + '\\pau=2000\\' + game.quiz[game.p].question);
    } else if (chosenQuiz == QUIZZES.digitalisierung) {
      speakOut(INTRODD + '\\pau=2000\\' + game.quiz[game.p].question);
    } else {
      speakOut(INTROD + '\\pau=2000\\' + game.quiz[game.p].question);
    }
  });
}


/**
 * Restart all the constants defined as arrays copying by value since they
 * may run out of elements after removing the picked up elements.
 */
function restartConstantsArrays() {
  rightIntro = RIGHT_INTRO.slice();
  nextQuestion = NEXT_QUESTION.slice();
  nextQuestionD = NEXT_QUESTIOND.slice();
  congrats = CONGRATS.slice();
  congratsD = CONGRATSD.slice();
  congrats5 = CONGRATS_5.slice();
  congrats5D = CONGRATS_5D.slice();
  congrats4 = CONGRATS_4.slice();
  congrats4D = CONGRATS_4D.slice();
  congrats3 = CONGRATS_3.slice();
  congrats3D = CONGRATS_3D.slice();
  congrats3DD = CONGRATS_3DD.slice();
  congrats2 = CONGRATS_2.slice();
  congrats2D = CONGRATS_2D.slice();
  congrats1 = CONGRATS_1.slice();
  congrats1D = CONGRATS_1D.slice();
  congrats0 = CONGRATS_0.slice();
  congrats0D = CONGRATS_0D.slice();
  jokes = JOKES.slice();
  rightSet = RIGHT_SET.slice();
  wrongSet = WRONG_SET.slice();
}


/**
 * Make Pepper speak out the text string we sent. Use 'ALAnimatedSpeech' for
 * contextually using a set of randomized gestures while speaking.
 * @param {string} text - Text message Pepper will speak out
 * @param {boolean} animated - Tell if animated say or just say
 */
function speakOut(text, animated) {
  if (animated == undefined) animated = true;
  if (animated) {
    var configuration = {
      'bodyLanguageMode': 'contextual',
    };
    services.aSay.then(function(tts) {
      tts.say(text, configuration);
    });
  } else {
    services.tts.then(function(tts) {
      tts.say(text);
    });
  }
}


/**
 * Make Pepper launch a behavior given its name
 * @param {string} bName - Behavior name installed on Pepper (full path name)
 */
function launchBehavior(bName) {
  services.behavior.then(function(behavior) {
    return behavior.startBehavior(bName);
  });
}


/**
 * Check if the answer is write or wrong, apply the proper style and make Pepper
 * react (speak + gestures) accordingly.
 * @param {string} id - Id of the element clicked that will be checked
 */
function answerFeedback(id) {
  game.quiz[game.p].answered = true;
  // clearInterval(countdown);
  var sound;
  var reaction;
  var ref = $('#' + id).attr('name');
  var rAnswer = $('[name=right]').children('div').html();
  if ($('#' + id).attr('name') == 'right') {
    $('#' + id).addClass('light-green accent-1');
    game.quiz[game.p].correct = true;
    sound = AUDIO_PATH + RANS_SOUND;
    if (game.german) reaction = game.quiz[game.p].right_ans[1];
    else {
      reaction = randomPick(rightSet); // Pick a positive reaction
      if (typeof reaction == 'undefined') { // If no reactions left
        rightSet = RIGHT_SET.slice(); // Copy again the elements by value
        reaction = randomPick(rightSet); // Pick a positive reaction
      }
    }
  } else {
    $('#' + id).addClass('red lighten-4');
    $('[name=right]').addClass('light-green accent-1');
    sound = AUDIO_PATH + WANS_SOUND;
    if (game.german) {
      switch (ref) {
        case 'wrong1':
          if (game.german) reaction = game.quiz[game.p].wrong_ans1[1];
          break;
        case 'wrong2':
          reaction = game.quiz[game.p].wrong_ans2[1];
          break;
        case 'wrong3':
          reaction = game.quiz[game.p].wrong_ans3[1];
          break;
        default: // Not really needed, but just in case
          reaction = '';
      }
    } else {
      reaction = randomPick(wrongSet); // Pick a positive reaction
      if (typeof reaction == 'undefined') { // If no reactions left
        wrongSet = WRONG_SET.slice(); // Copy again the elements by value
        reaction = randomPick(wrongSet); // Pick a positive reaction
      }
      var rightIs = randomPick(rightIntro);
      if (typeof rightIs == 'undefined') {
        rightIntro = RIGHT_INTRO.slice();
        rightIs = randomPick(rightIntro);
      }
      // In case of wrong answer chosen, add this before the right answer
      rAnswer = rightIs + ' ' + rAnswer;
    }
  }
  game.quiz[game.p].answered = true;
  playSound(sound);
  if (!game.german && !game.quiz[game.p].correct) {
    reaction = reaction + ' ' + rAnswer;
  }
  speakOut(reaction);
}


/**
 * Play a sound file from the given path.
 * @param {string} fname - Absolute path of the sound that will be played
 */
function playSound(fname) {
  try {
    services.aPlayer.then(function(ap) {
      ap.playFile(fname);
    });
  } catch (err) {
    console.log(err.message); // Print the error on a JS console
  }
}


/** Set a timeout for telling a joke and recursively call the function when the
 * timeout is over until the current question is answered.
 */
function checkTime() {
  setTimeout(function() {
    if (!game.quiz[game.p].answered && !cStatus.feedback.spoken && !game.german && !cStatus.speaking) {
      tellJoke();
      // checkTime();
    }
  }, LIMIT);
}


// /**
//  * Simulate a wait method which stops the script the number of milliseconds
//  * passed to it.
//  * @param {number} milliseconds - The number of milliseconds to wait
//  */
// function sleep(milliseconds) {
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds) break;
//   }
// }


/**
 * Reset the style for the background of the clicked answers by removing
 * color classes (green for right and red for wrong). Also remove the
 * attribute name='right' for the right answer.
 */
function resetStyles() {
  for (var i = 1; i <= 4; i++) {
    if ($('#bg-' + i).attr('name') == 'right') {
      $('#bg-' + i).removeClass('light-green accent-1 ');
      $('#bg-' + i).removeAttr('name');
    } else $('#bg-' + i).removeClass('red lighten-4 ');
    // sleep(1000);
  }
}


/**
 * Read and parse a TSV (Tab-Separated Value) file with questions and
 * answers. Each row contains one question followed by 4 answers (1 right and
 * 3 wrong), and also followed by its unique reaction in case of german quiz.
 * Given format:
 * "question  answer1  answer2  answer3  answer4\n".
 * German quiz:
 * "question  ans1  ans2  ans3  ans4  react1  react2  react3  react4  story\n"
 * Return an array of objects (dict) where each element contains a question and
 * its 4 possible answers. Returned format example of one array element:
 * [{
 *    "question": "What is foo?",
 *    "right_ans": "This is the correct answer.",
 *    "wrong_ans1": "This is a wrong answer.",
 *    "wrong_ans2": "This is another wrong answer.",
 *    "wrong_ans3": "This is another wrong answer.",
 *    ...
 * }]
 * In case of the german quiz (deutsch = true):
 * [{
 *    "question": "What is Foo?",
 *    "right_ans": ["Correct answer", "Customized feedback for this answer"],
 *    "wrong_ans1": ["Wrong answer 1", "Customized feedback for this answer"],
 *    "wrong_ans2": ["Wrong answer 2", "Customized feedback for this answer"],
 *    "wrong_ans3": ["Wrong answer 3", "Customized feedback for this answer"],
 *    "story": "Story or extra info related to this question.",
 *    ...
 * }]
 * @param {string} data - Plain text containing all questions and answers
 * @param {boolean} german - Tell if TSV data sent is from the german quiz
 * @return {Array.Object.<string, string|Array.string>} - Array of dicts
 * containing all questions and answers as key-value pairs. In case of the
 * german quiz, the key values for the answers are unique answer-reaction pairs.
 */
function readTSV(data, german) {
  if (german == undefined) german = false;
  var quizList = []; // This will actually be an array of dicts
  // Store all content of the .tsv file into an array, each element is a row
  // console.log(data);
  var rows = data.split(/\r\n|\n/);
  rows.shift();
  // For all rows read from the given file
  for (var i = 0; i < rows.length; i++) {
    // Separe and store all fields (tab-separated) for the current row
    row = rows[i].split('\t');
    // Store the fields into a dictionary using key-value pairs
    // Every new element (pushed) of the array is a dict with the row elements
    if (german) {
      quizList.push({
        acronym: row[0],
        question: row[1],
        right_ans: [row[2], row[6]],
        wrong_ans1: [row[3], row[7]],
        wrong_ans2: [row[4], row[8]],
        wrong_ans3: [row[5], row[9]],
        story: row[10],
        eTime: 0,
        answered: false,
        correct: false,
      });
    } else {
      quizList.push({
        question: row[0],
        right_ans: row[1],
        wrong_ans1: row[2],
        wrong_ans2: row[3],
        wrong_ans3: row[4],
        story: row[5],
        media: row[6],
        eTime: 0,
        answered: false,
        correct: false,
      });
    }
  }
  return quizList;
}


/**
 * Shuffle the elements of a given array, return the shuffled array.
 * @param {Array} arr - Given array
 * @return {Array} - Shuffled array
 */
function shuffleArray(arr) {
  var j;
  var x;
  var i;
  for (i = arr.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = arr[i];
    arr[i] = arr[j];
    arr[j] = x;
  }
  return arr;
}


/**
 * Set the question and its answers (order shuffled) on the template.
 * @param {Array.Object.<string, string|Array.string>} quiz - Array of dicts
 * In case of german quiz, the key value is an array of strings containing an
 * unique answer-reaction pair.
 * @param {number} pos - Current stored position of the quiz
 */
function setQandA() {
  effect = JQUERY_FX[Math.floor((Math.random() * JQUERY_FX.length))];
  resetStyles();
  var order = [1, 2, 3, 4]; // Create an array for the answers ordering
  order = shuffleArray(order); // Shuffle the order of the elements
  // Write/substitute the content of these html elements for the current Q & As
  $('#question').html(game.quiz[game.p].question);
  $('#bg-' + order[0]).attr('name', 'right');
  $('#bg-' + order[1]).attr('name', 'wrong1');
  $('#bg-' + order[2]).attr('name', 'wrong2');
  $('#bg-' + order[3]).attr('name', 'wrong3');
  if (game.german) {
    $('#answer-' + order[0]).html(game.quiz[game.p].right_ans[0]);
    $('#answer-' + order[1]).html(game.quiz[game.p].wrong_ans1[0]);
    $('#answer-' + order[2]).html(game.quiz[game.p].wrong_ans2[0]);
    $('#answer-' + order[3]).html(game.quiz[game.p].wrong_ans3[0]);
  } else {
    $('#answer-' + order[0]).html(game.quiz[game.p].right_ans);
    $('#answer-' + order[1]).html(game.quiz[game.p].wrong_ans1);
    $('#answer-' + order[2]).html(game.quiz[game.p].wrong_ans2);
    $('#answer-' + order[3]).html(game.quiz[game.p].wrong_ans3);
  }
  // Display the current question number
  $('#current-q').html(game.p + 1);
  // Display the number of questions
  $('#total-q').html(game.quiz.length);
  openingFX(effect);
}


/**
 * Show the current question and its answers with a random effect.
 * @param {string} fx - Picked effect from the list JQUERY_FX
 */
function openingFX(fx) {
  switch (fx) {
    case 'toggle':
      $('#quiz').show('fast');
      break;
    case 'fadeToggle':
      $('#quiz').fadeIn('slow');
      break;
    case 'slideToggle':
      $('#quiz').slideDown('slow');
      break;
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
      return $('#quiz').hide('slow');
      break;
    case 'fadeToggle':
      return $('#quiz').fadeOut('slow');
      break;
    case 'slideToggle':
      return $('#quiz').slideUp('slow');
      break;
  }
}


/** Tell a random joke from the list. */
function tellJoke() {
  var joke = randomPick(jokes);
  if (typeof joke == 'undefined') { // If there are no jokes left
    jokes = JOKES.slice(); // Copy again the array elements by value
    joke = randomPick(jokes); // Pick a joke
  }
  speakOut(joke); // Make Pepper tell the chosen joke
}


/**
 * Pick a random element of a given array and delete it afterwards.
 * @param {Array} arr - Given array
 * @return {Object} - Randomly-picked element of the array
 */
function randomPick(arr) {
  // Pick a random element index between 0 and arr.length - 1
  var rnd = Math.floor((Math.random() * arr.length));
  var picked = arr[rnd]; // Store the value of the index picked from this array
  arr.splice(rnd, 1); // Remove the picked element and reindex the array
  return picked;
}


/** Pepper's talking status. Control the flow of the game.
 * @param {Array} value - List containing the current TTS task id and status
 */
function talkingStatus(value) {
  var ttsID = value[0];
  var status = value[1];
  if (status == 'enqueued') cStatus.speaking = true;
  else if (status == 'done') cStatus.speaking = false;
  if (cStatus.about) {
    if (status == 'done') hideMedia();
  } else if (cStatus.question.id == undefined) cStatus.question.id = ttsID;
  else if (cStatus.question.id == ttsID && (status == 'done' || status == 'stopped')) {
    cStatus.question.spoken = true;
    // Display the current question once it has been spoken
    setQandA();
    checkTime();
  } else if (cStatus.feedback.id == undefined && game.quiz[game.p].answered) {
    cStatus.feedback.id = ttsID;
  } else if (cStatus.feedback.id == ttsID && (status == 'done' || status == 'stopped')) {
    cStatus.feedback.spoken = true;
    closingFX(effect).promise().done(function() {
      if (!game.german) displayMedia(game.quiz[game.p].media);
      tellStory(game.quiz[game.p].story);
    });
  } else if (cStatus.feedback.spoken && cStatus.story.id == undefined) {
    cStatus.story.id = ttsID;
  } else if (cStatus.story.id == ttsID && (status == 'done' || status == 'stopped')) {
    cStatus.story.spoken = true;
    if (!game.german) hideMedia();
    // else hideMedia();
    if (game.p == game.quiz.length - 1) {
      launchBehavior(B_WINNER);
      var totalRight = game.nCorrect();
      var reaction;
      var pause = '\\pau=3000\\';
      if (!game.german) reaction = randomPick(congrats) + pause;
      else reaction = randomPick(congratsD) + pause;
      switch (totalRight) {
        case 0:
          if (!game.german) reaction += randomPick(congrats0);
          else reaction += randomPick(congrats0D);
          break;
        case 1:
          if (!game.german) reaction += randomPick(congrats1);
          else reaction += randomPick(congrats1D);
          break;
        case 2:
          if (!game.german) reaction += randomPick(congrats2);
          else reaction += randomPick(congrats2D);
          break;
        case 3:
          if (!game.german) reaction += randomPick(congrats3);
          else if (chosenQuiz == QUIZZES.digitalisierung) {
            reaction += randomPick(congrats3DD);
          }
          else reaction += randomPick(congrats3D);
          break;
        case 4:
          if (!game.german) reaction += randomPick(congrats4);
          else reaction += randomPick(congrats4D);
          break;
        case 5:
          if (!game.german) reaction += randomPick(congrats5);
          else reaction += randomPick(congrats5D);
          break;
        default:
      }
      if (!game.german) displayMedia('congratulations.png');
      else if (chosenQuiz == QUIZZES.digitalisierung) {
        displayMedia('digitalisierung-logo.png');
      }
      else displayMedia('ghcampus-logo.png');
      reaction += pause;
      speakOut(reaction, animated = false);
    } else {
      game.p++;
      var nextQ;
      var pause0 = '\\pau=1500\\';
      var pause1 = '\\pau=500\\';
      if (!game.german) {
        nextQ = randomPick(nextQuestion);
        if (typeof nextQ == 'undefined') {
          nextQuestion = NEXT_QUESTION.slice();
          nextQ = randomPick(nextQuestion);
        }
      } else {
        nextQ = randomPick(nextQuestionD);
        if (typeof nextQ == 'undefined') {
          nextQuestionD = NEXT_QUESTIOND.slice();
          nextQ = randomPick(nextQuestionD);
        }
      }
      speakOut(pause0 + nextQ + pause1 + game.quiz[game.p].question);
      cStatus = new CurrentStatus();
    }
  } else if (game.quiz.length - 1 == game.p && cStatus.story.spoken &&
    cStatus.congrats.id == undefined) {
    console.log('I am on congrats undefined');
    cStatus.congrats.id = ttsID;
  } else if (cStatus.congrats.id == ttsID && (status == 'done' || status == 'stopped')) {
    console.log('I am on congrats done');
    game.completed = true;
    hideMedia();
    goToMenu();
  }
  console.log('TTS status[' + ttsID + ']: ' + status);
}


/** Hide quiz game and go to the main menu. */
function goToMenu() {
  stopTTS();
  cStatus = undefined;
  cStatus = new CurrentStatus();
  $('#quiz').hide('slow');
  $('#game').hide('slow');
  $('#menu').show('fast');
}


/** TTS' current sentence.
 * @param {string} sentence - Current sentence
 */
function currentSentence(sentence) {
  if (sentence) console.log('Current sentence: ' + sentence);
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
        evt.signal.connect(talkingStatus);
      });
    });
  } catch (err) {
    console.log(err.message); // Print the error on a JS console
  }
}


/**
 * Stop the TTS service.
 */
function stopTTS() {
  services.tts.then(function(tts) {
    tts.stopAll();
  });
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
        evt.signal.connect(currentSentence);
      });
    });
  } catch (err) {
    // console.log(err.message); // Print the error on a JS console
  }
}


/** Tell the story related to the current question if any. */
function tellStory() {
  var pause = '\\pau=0\\';
  if (game.p == game.quiz.length - 1) pause = '\\pau=2500\\';
  if (game.quiz[game.p].story != '') speakOut(game.quiz[game.p].story + pause);
}


/** Display a video or an image (also GIFs) depending on the given media.
 * @param {string} fname - File name
 */
function displayMedia(fname) {
  var extension = fname.slice(fname.length - 3, fname.length);
  // var path = '/home/nao/media/' + fname // only works for audio files
  var path = MEDIA_URL + fname;
  cStatus.media.url = path;
  if (extension == 'mp4') {
    services.tablet.then(function(tablet) {
      tablet.playVideo(path);
      cStatus.media.type = 'video';
    });
  } else { // else if (extension == 'gif' || extension == 'png')
    services.tablet.then(function(tablet) {
      tablet.showImageNoCache(path);
      cStatus.media.type = 'image';
    });
  }
}


/** Stop a video or hide an image depending what media is displayed. */
function hideMedia() {
  if (cStatus.media.type == 'video') {
    services.tablet.then(function(tablet) {
      tablet.stopVideo();
    });
  } else {
    services.tablet.then(function(tablet) {
      tablet.hideImage();
    });
  }
}


/** Set the language of the TTS. */
function setLanguage() {
  services.tts.then(function(tts) {
    if (game.german) tts.setLanguage('German');
    else tts.setLanguage('English');
  });
}


/** Set the TTS parameters. */
function setLangParams() {
  services.tts.then(function(tts) {
    if (game.german) {
      tts.setParameter('pitchShift', TTSPARAMS.pitchShift);
      tts.setParameter('speed', TTSPARAMS.speed);
    }
  });
}


/** Randomly select a specific number of questions from the quiz.
 * @param {Array.Object.<string, string|Array.string>} qList - The whole quiz
 * @param {number} total - Number of random questions to select
 * @param {boolean} german - Tell if german quiz or not
 * @return {Array.Object.<string, string|Array.string>}
 */
function selectQuestions(qList, total, german) {
  var picked = [];
  for (var i = 0; i < total; i++) picked.push(randomPick(qList));
  return picked;
  // if (!german) {
  //   for (var i = 0; i < total; i++) picked.push(randomPick(qList));
  // } else {
  //   for (var i = 0; i < total; i++) {
  //     if (picked.length > 0) {
  //       var checked = 0;
  //       var unique = false;
  //       while (!unique) {
  //         var pick = randomPick(qList);
  //         for (var j = 0; j < picked.length; j++) {
  //           if (pick.acronym != picked[j].acronym) checked++;
  //           else {
  //             pick = randomPick(qList);
  //             j = 0;
  //             checked = 0;
  //           }
  //         }
  //         picked.push(pick);
  //         unique = true;
  //       }
  //     } else picked.push(randomPick(qList));
  //   }
  // }
  // return picked;
}


/** Add a click event listener for each possible answer */
function addClickListeners() {
  $('#bg-1').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'));
    }
  });
  $('#bg-2').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'));
    }
  });
  $('#bg-3').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'));
    }
  });
  $('#bg-4').on('click', function() {
    if (!cStatus.speaking && !game.quiz[game.p].answered) {
      answerFeedback($(this).attr('id'));
    }
  });
}


/** Read data from all TSV file as plain text.
 * @param {string} data - Get the raw data from the TSV files
 * @return {Object} - Return the read raw data from all TSV files
 */
function getRawData(data) {
  return $.get(data, 'text');
}


// Once the document is loaded/ready do different stuff
$(document).ready(function() {
  // Read the files and store questions and its answers, stories, etc.
  getRawData(QUIZZES.cogsci).done(function(data) {
    quizzes.cogsci = readTSV(data);
    // getRawData(QUIZZES.ibm).done(function(data) {
    //   quizzes.ibm = readTSV(data);
    getRawData(QUIZZES.digitalisierung).done(function(data) {
      quizzes.digitalisierung = readTSV(data, true); // german quiz
      getRawData(QUIZZES.deutsch).done(function(data) {
        qSession = new QiSession();
        services = new Services(qSession);
        quizzes.deutsch = readTSV(data, true); // true -> german = true
        // Shuffle the order of the questions
        quizzes.cogsci = shuffleArray(quizzes.cogsci);
        // quizzes.ibm = shuffleArray(quizzes.ibm);
        quizzes.digitalisierung = shuffleArray(quizzes.digitalisierung);
        quizzes.deutsch = shuffleArray(quizzes.deutsch);
        // Store a copy of the whole quiz so that it can be restored if empty
        storedQuizzes = JSON.parse(JSON.stringify(quizzes));
        $('#cogsci-icon').attr('src', MEDIA_URL + 'uos_red.png');
        $('#ibm-icon').attr('src', MEDIA_URL + 'ibm.png');
        $('#digital-icon').attr('src', MEDIA_URL + 'digitalisierung.png');
        $('#ghcampus-icon').attr('src', MEDIA_URL + 'gc.png');
        $('#pepper-icon').attr('src', MEDIA_URL + 'pepper.png');
        $('#general').attr('src', MEDIA_URL + 'general.png');
        $('#features').attr('src', MEDIA_URL + 'features.png');
        $('#study-project').attr('src', MEDIA_URL + 'group.png');
        $('#header-about').attr('src', MEDIA_URL + 'cogsci-ibm.png');
        $('#general').on('click', function() {
          displayMedia('general.png');
          speakOut(GENERAL_INFO);
        });
        $('#features').on('click', function() {
          displayMedia('features.png');
          speakOut(TECHNICAL_INFO);
        });
        $('#study-project').on('click', function() {
          displayMedia('group.png');
          speakOut(SP_INFO);
        });
        $('#go-to-menu').on('click', function() {
          goToMenu();
        });
        $('#go-back').on('click', function() {
          $('#about-me').hide('slow');
          $('#menu').show('fast');
        });
        $('#close-app').on('click', function() {
          services.behavior.then(function(behavior) {
            services.memory.then(function(memory) {
              memory.getData('packageUid').then(function(uid){
                var packageUid = uid;
                // behavior.stopBehavior("digitalisierung-quiz/quiz");
                // Get the package UID previously stored in memory
                behavior.stopBehavior(packageUid + '/quiz');
              });
            });
          });
        });
        cStatus = undefined;
        cStatus = new CurrentStatus();
        $('#menu').show('fast');
        menuClickListeners();
        subscribeTalkingStatus();
        subscribeCurrentSentence();
      });
    });
  });
});
