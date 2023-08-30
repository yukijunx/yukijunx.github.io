const express = require('express');
const expressBasicAuth = require('express-basic-auth');
const app = express();
const API_PORT = 1123;

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.listen(API_PORT, () => {
	console.log(`Listening on localhost: ${API_PORT}`)
});

// ==========ALLOW USER REGISTER==========

const users={
    'admin':'topsecret'
}

app.use('/register/:USERNAME/:PASSWORD',function(req,res,next){
    let username=req.params.USERNAME;
    let password=req.params.PASSWORD;
    if (users[username]) {
        return res.status(400).json('The username is occupied!');
      }
    users[username] = password;
    res.status(200).json('Registration successful!');
})

// ==========ALLOW USER LOG IN==========

const authorise = expressBasicAuth({
    users: users,
    // actually will not use 'no credentials provided' part.
	unauthorizedResponse: (req) => ((req.auth)? 'Credentials  rejected.' : 'No credentials provided'),
	challenge: true
})

app.use('/login', authorise, function(req,res,next){
    res.status(200).json(req.auth.user)
})

app.use(express.static('content'));

// ==========GIVE LIST OF COMPONENTS TO THE CLIENT==========

const face_components = [
    {'filename':'face-yellow.png'},
    {'filename':'face-grey.png'},
    {'filename':'face-pink-rosy.png'}
]
const hair_components = [
    {'filename':'hair-bob-brown.png'},
    {'filename':'hair-bowl-brown.png'},
    {'filename':'hair-curly-brown.png'},
    {'filename':'hair-curly-ginger.png'},
    {'filename':'hair-pigtails-brown.png'},
    {'filename':'hair-short-brown.png'},
    {'filename':'hair-short-teal.png'}
]
const eyes_components = [
    {'filename':'eyes-smiley.png'},
    {'filename':'eyes.png'},
    {'filename':'eyes-smiley-pale-blue.png'},
    {'filename':'eyes-pale-blue.png'}
]
const mouth_components = [
    {'filename':'mouth-grin.png'},
    {'filename':'mouth-grin-pink.png'},
    {'filename':'mouth-smile.png'}
]

// fetch from 'http://localhost:1123/face_components' to get json of face components.
app.use('/face_components', function(req,res,next) {
	res.status(200).json(face_components);
});
// fetch from 'http://localhost:1123/hair_components' to get json of hair components.
app.use('/hair_components', function(req,res,next) {
	res.status(200).json(hair_components);
});
// fetch from 'http://localhost:1123/eyes_components' to get json of eyes components.
app.use('/eyes_components', function(req,res,next) {
	res.status(200).json(eyes_components);
});
// fetch from 'http://localhost:1123/mouth_components' to get json of mouth components.
app.use('/mouth_components', function(req,res,next) {
	res.status(200).json(mouth_components);
});

// ==========ALLOW CLIENT SUBMIT NEW EMOJITAR==========

const emojitars = new Array();

app.use('/emojitar/:FACE/:HAIR/:EYES/:MOUTH/:CREATOR/:DATE/:DESC', function(req,res,next) {
	let face=req.params.FACE;
    let hair=req.params.HAIR;
    let eyes=req.params.EYES;
    let mouth=req.params.MOUTH;
    let creator=req.params.CREATOR;
    let date=req.params.DATE;
    let description=req.params.DESC;
    let id=emojitars.length
    for (i in emojitars){
        let emoji=emojitars[i];
        if (emoji.face==face & emoji.hair==hair & emoji.eyes==eyes & emoji.mouth==mouth){
            return res.status(400).json({msg:'Emojitar already exists'})
        }
    }
    emojitars.push({
        'id':id,
        'face':face,
        'hair':hair,
        'eyes':eyes,
        'mouth':mouth,
        'creator':creator,
        'date':date,
        'description':description,
        'rate':[],
        'comments':[]
    })
    res.status(200).json(emojitars);
});

// ==========ALLOW CLIENT SUBMIT OR DELETE RATING FOR AN EMOJITAR==========

app.use('/rate/:EMOID/:RATER/:RATE', function(req,res,next){
    let emoid=req.params.EMOID;
    let rater=req.params.RATER;
    let rate=req.params.RATE;
    let ratelist=emojitars[emoid].rate;
    let delete_exist=false;
    for (rateindex in ratelist){
        // if the rater has already rated,
        if (Object.keys(ratelist[rateindex])[0]==rater){
            // if the new rate is the same as the old rate by this rater, delete
            if (Object.values(ratelist[rateindex])[0]==rate){
                ratelist.splice(rateindex,1);
                delete_exist=true;
                res.status(200).json(ratelist)
            }else{
                // if the new rate is not the same, overwrite it
                ratelist[rateindex][[rater]]=rate;
                delete_exist=true;
                res.status(200).json(ratelist)
            }
        }
    };
    // if we have not found a rate by the rater, we record this rate
    if (delete_exist==false){
        ratelist.push({[rater]:rate})
        res.status(200).json(ratelist)
    }

})

// ==========ALLOW CLIENT REQUEST ALL EMOJITAR==========

app.use('/emojitars', function(req,res,next){
    res.status(200).json(emojitars)
})

// ==========ALLOW CLIENT DELETE THEIR OWN EMOJITAR==========

app.use('/delete/:EMOID',function(req,res,next){
    let emoid=req.params.EMOID;
    emojitars.splice(emoid,1);
    res.status(200).json(emojitars)
})

// ==========ALLOW USER COMMENT ON EMOJITAR==========

app.use('/comment/:EMOID/:COMMENTER/:COMMENT/:DATETIME', function(req,res,next){
    let emoid=req.params.EMOID;
    let commenter=req.params.COMMENTER;
    let commentlist=emojitars[emoid].comments;
    let comment=req.params.COMMENT;
    let datetime=req.params.DATETIME;
    let infostr='by '+commenter+' at '+datetime;
    commentlist.push({'info':infostr,'contend':comment});
    return res.status(200).json(commentlist)
})
