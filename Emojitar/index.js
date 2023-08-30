window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                content: 'make',
                description: '',
                compopath:'/elements/',
                facelist:['face-1','face-2','face-3','face-4'],
                eyeslist:['eyes-1','eyes-2','eyes-3','eyes-4'],
                hairlist:['hair-1','hair-2','hair-3','hair-4'],
                mouthlist:['mouth-1','mouth-2','mouth-3','mouth-4'],
                selectedlist:['face-1','hair-1','eyes-1','mouth-1'],
                filterDate:'0000-00-00',
                filterRate:0,
                allEmojitars:[],
                loggedin:false,
                registermsg:'',
            }
        },
        methods: {

        },
        mounted: function () {
        },

    });
    app.mount('#body-container');
};