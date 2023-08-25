window.onload = () => {
    const app = Vue.createApp({
        data: function () {
            return {
                showColumn1: true,
                showColumn2: false
            }
        },
        methods: {
            toggleColumns: function () {
                this.showColumn1 = !this.showColumn1;
                this.showColumn2 = !this.showColumn2;
            },

            getVisitorCount: async function () {
                let countSpan = document.getElementById('count');
                fetch("https://fixed-silver-cough.glitch.me/visit")
                    .then(response => response.text())
                    .then(data => {
                        let num = data;
                        let numLast = num[num.length - 1];
                        let lastDigit = parseInt(numLast);
                        if (lastDigit == 1) {
                            countSpan.innerHTML = `${num}st`;
                        } else if (lastDigit == 2) {
                            countSpan.innerHTML = `${num}nd`;
                        } else if (lastDigit == 3) {
                            countSpan.innerHTML = `${num}rd`;
                        } else {
                            countSpan.innerHTML = `${num}th`;
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching visitor count:", error);
                    });
            }
        },
        mounted: function () {
            this.getVisitorCount();
        },
    });
    app.mount('.body-container');
};
