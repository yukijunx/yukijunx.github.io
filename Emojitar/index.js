window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                content: 'make',
                description: '',
                compopath: '/Emojitar/elements/',
                facelist: ['face-1', 'face-2', 'face-3', 'face-4'],
                hairlist: ['hair-1', 'hair-2', 'hair-3', 'hair-4'],
                eyeslist: ['eyes-1', 'eyes-2', 'eyes-3', 'eyes-4'],
                mouthlist: ['mouth-1', 'mouth-2', 'mouth-3', 'mouth-4'],
                selectedlist: ['face-1', 'hair-1', 'eyes-2', 'mouth-4'],
                filterDate: '0000-00-00',
                filterRate: 0,
                allEmojitars: [],
                loggedin: false,
                currentUser: undefined,
                usernameInput: '',
                passwordInput: '',
                registermsg: '',
            }
        },
        methods: {
            login: async function () {
                if (this.usernameInput == '' || this.passwordInput == '') {
                    alert('Username and password cannot be empty!');
                    return
                };
                let user_key = btoa(this.usernameInput + ':' + this.passwordInput);
                this.usernameInput = '';
                this.passwordInput = '';
                try {
                    var resp = await fetch('https://fixed-silver-cough.glitch.me/EmojitarLogin', { method: 'GET', headers: { "Authorization": "Basic " + user_key } });
                    if (resp.status == 200) {
                        var dat = await resp.json();
                        this.loggedin = true;
                        this.currentUser = dat;
                        this.registerMsg = '';
                        alert('Logged in succesfully!')
                    };
                    if (resp.status == 401) {
                        var error = await resp.text();
                        this.registerMsg = error;
                    }
                } catch (err) {
                    console.log('Error: ', err)
                }
            },
            register: async function () {
                if (this.usernameInput == '' || this.passwordInput == '') {
                    alert('Username and password cannot be empty!');
                    return
                };
                try {
                    var resp = await fetch(`https://fixed-silver-cough.glitch.me/${this.usernameInput}/${this.passwordInput}`);
                    var dat = await resp.json();
                    if (resp.status == 400) {
                        this.registerMsg = dat;
                    };
                    if (resp.status == 200) {
                        this.loggedin = true;
                        this.currentUser = this.usernameInput;
                        this.registerMsg = dat;
                        this.usernameInput = '';
                        this.passwordInput = '';
                        alert('Registered and logged in succesfully!')
                    };
                } catch (err) { console.log('Error:', err) };
            },
            logout: function () {
                this.loggedin = false;
                this.currentUser = '';
                this.registerMsg = '';
            },
            getEmojitar: async function () {
                await fetch('https://fixed-silver-cough.glitch.me/getemojitar', {
                    method: "get",
                    headers: {
                        "Content-Type": "application/json"
                    },
                })
                    .then((res) => res.json())
                    .then((resjson) => {
                        console.log('resjson of getEmojitar', resjson)
                        this.allEmojitars = resjson;
                        console.log('after getEmojitar', this.allEmojitars)
                    })
                    .catch(err => { console.log('get all emojitars error: ', err) })
            },
            submitEmojitar: async function () {
                let newEmojitarInfo = {
                    'face': this.selectedlist[0],
                    'hair': this.selectedlist[1],
                    'eyes': this.selectedlist[2],
                    'mouth': this.selectedlist[3],
                    'id': this.allEmojitars.length,
                    'creator': this.currentUser,
                    'date': new Date().toISOString().slice(0, 10),
                    'description': this.description,
                    'rate': [],
                    'comments': []
                };
                await fetch(`https://fixed-silver-cough.glitch.me/submitemojitar`, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 'data': newEmojitarInfo })
                })
                    .then((res) => res.text())
                    .then(function (res) {
                        alert(res);
                    })
                    .catch(err => {
                        console.log('submit new emojitar error: ', err);
                        alert('Something went wrong, try again later!')
                    });
                await this.getEmojitar();
            },
            submitbutton: async function () {
                for (let i = 0; i < this.allEmojitars.length; i++) {
                    if (
                        this.allEmojitars[i].face == this.selectedlist[0] &&
                        this.allEmojitars[i].hair == this.selectedlist[1] &&
                        this.allEmojitars[i].eyes == this.selectedlist[2] &&
                        this.allEmojitars[i].mouth == this.selectedlist[3]
                    ) {
                        alert('Identical emojitar already exists!');
                        return;
                    }
                };
                if (this.loggedin == false) {
                    alert('You have not signed in yet!');
                    return;
                } else if (this.description == '') {
                    alert('Description cannot be empty!')
                    return;
                } else {
                    this.submitEmojitar();
                }
            }
        },
        mounted: function () {
        },
    });
    app.mount('#body-container');
};