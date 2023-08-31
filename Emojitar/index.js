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
                emojitarviewing: 'all',
                usercomment: '',
                filterDate:'0000-00-00',
                filterRate:0,
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
                        alert('Logged in succesfully!');
                    };
                    if (resp.status == 401) {
                        var error = await resp.text();
                        console.log('Logging in error:', error);
                        alert('Incorrect username or password!')
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
                    var resp = await fetch(`https://fixed-silver-cough.glitch.me/EmojitarRegister/${this.usernameInput}/${this.passwordInput}`);
                    var dat = await resp.text();
                    if (dat == "occupied") {
                        alert("The username is already occupied!");
                    }else if(resp.status == 200) {
                        this.loggedin = true;
                        this.currentUser = this.usernameInput;
                        this.usernameInput = '';
                        this.passwordInput = '';
                        alert('Registered and logged in succesfully!')
                    };
                } catch (err) { console.log('Error:', err) };
            },
            logout: function () {
                this.loggedin = false;
                this.currentUser = '';
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
                    alert('You have not logged in yet!');
                    return;
                } else if (this.description == '') {
                    alert('Description cannot be empty!')
                    return;
                } else {
                    this.submitEmojitar();
                }
            },
            applyFilter: function () {
                for (let i = this.allEmojitars.length - 1; i >= 0; i--) {
                    let emoDate = new Date(this.allEmojitars[i].date);
                    let filDate = new Date(this.filterDate);
                    if ((emoDate < filDate) || (this.averageRate(this.allEmojitars[i].rate) < this.filterRate)) {
                        this.allEmojitars.splice(i, 1)
                    }
                }
            },
            clearFilter: async function () {
                this.getEmojitar();
                this.filterRate = 0;
            },
            deleteEmo: async function (emoid) {
                if (this.loggedin == false) {
                    alert('You have not logged in yet!');
                    return;
                } else {
                    if (this.currentUser == this.allEmojitars[emoid].creator) {
                        if (confirm('You sure you want to delete this emojitar?')) {
                            try {
                                var resp = await fetch(`https://fixed-silver-cough.glitch.me/deleteemojitar/${emoid}`, { credentials: 'include', withCredentials: true });
                                var dat = await resp.json();
                                this.allEmojitars = dat;
                            } catch (err) { console.log('Error: ', err) };
                            this.viewPage = 'all';
                        }
                    }
                };
            },
            sendRate: async function (emoid, starnum) {
                if (this.loggedin == false) {
                    alert('You have not logged in yet!');
                    return;
                } else if (this.currentUser == this.allEmojitars[emoid].creator) {
                    alert('You cannot rate your own emojitar!')
                } else {
                    let url = `https://fixed-silver-cough.glitch.me/rateemojitar/${emoid}/${this.currentUser}/${starnum}`;
                    try {
                        var resp = await fetch(url, { credentials: 'include', withCredentials: true });
                        var dat = await resp.json();
                        this.allEmojitars[emoid].rate = dat;
                    } catch (err) { console.log('Error:', err) };
                }
            },
            averageRate: function (rateList) {
                if (rateList.length == 0) {
                    return 0
                };
                let numlist = [];
                for (let j in rateList) {
                    numlist.push(Object.values(rateList[j])[0])
                };
                let sum = 0;
                for (let num in numlist) {
                    sum = sum + parseInt(numlist[num])
                };
                return (sum / rateList.length)
            },
            sendComment: async function (emoid, commentToSend) {
                if (this.loggedin == false) {
                    alert('You have not logged in yet!');
                    return;
                } else if (this.currentUser == this.allEmojitars[emoid].creator) {
                    alert('You cannot comment on your own emojitar!')
                } else if (this.usercomment == '') {
                    alert('Comment cannot be empty!')
                    return;
                } else {
                    let date = new Date().toLocaleDateString().replace(/[^apm\d]+/gi, '-');
                    let time = new Date().toLocaleTimeString();
                    let datetime = date + ' ' + time;
                    let url = `https://fixed-silver-cough.glitch.me/commentemojitar/${emoid}/${this.currentUser}/${commentToSend}/${datetime}`;
                    try {
                        var resp = await fetch(url, { credentials: 'include', withCredentials: true });
                        if (resp.ok) {
                            this.loggedin = true;
                            this.usercomment = '';
                        };
                        var dat = await resp.json();
                        this.allEmojitars[emoid].comments = dat;
                    } catch (err) { console.log('Error:', err) };
                }
            },
        },
        mounted: function () {
            this.getEmojitar();
        },
    });
    app.mount('#body-container');
};