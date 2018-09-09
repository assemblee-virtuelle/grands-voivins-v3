Polymer({
    is: 'semapps-axo',

    // Wait all HTML to be loaded.
    attached() {
        SemAppsCarto.ready(this.start.bind(this));
    },

    start(){
        //Lance la methode axoReady du map handler TODO: a transformer en observer
        this.domHost.axoReady();

        let zones = this.querySelectorAll('g[id^="Selection_"] > path, g[id^="Selection_9"] > polygon, g[id^="Selection_2"] > g > path');
        let fills = this.querySelectorAll('g[id^="Fill_"] > path, g[id^="Fill_9"] > polygon,  g[id^="Selection_2"] > g > path');

        zones.forEach((element, index) => {

            // element.addEventListener('mouseover', (el) => {
                
            //     fills[index].style.fill = "green";
            // });

            // element.addEventListener('mouseout', (el) => {
            //     fills[index].style.fill = "transparent";
            // });
            let batiment = element.parentNode.parentNode;
            element.addEventListener('click', (e) => {
                fills.forEach(el => {
                    el.style.fill = "transparent";
                })
                fills[index].className.baseVal = "red";
                switch (batiment.id) {
                    case 'CED':
                    this.goToDetail('#');
                        break;
                    case 'Pinard':
                    this.goToDetail('#');
                        break;
                    case 'Lingerie':
                    this.goToDetail('#');
                        break;
                    case 'Colombani':
                    this.goToDetail('#');
                        break;
                    case 'Rapine':
                    this.goToDetail('#');
                        break;
                    case 'Pierre_petit':
                    this.goToDetail('#');
                        break;
                    case 'Cour_Robin':
                    this.goToDetail('#');
                        break;
                    case 'Cour_Oratoire_1_':
                    this.goToDetail('#');
                        break;
                    case 'Selection_2_':
                    this.goToDetail('#');
                        break;
                    default:
                        break;
                }
            });
        })
    },

    goToDetail(uri){

        semapps.scrollToContent();
        semapps.myRoute = "detail";
        semapps.goToPath('detail', {
            uri: window.encodeURIComponent(uri)
        });
    }


});