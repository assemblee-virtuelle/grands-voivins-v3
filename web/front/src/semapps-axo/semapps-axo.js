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
                switch (batiment.id) { //TODO: A changer vers une maniere plus generique par fichier de conf
                    case 'CED':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/6349042113-2132451547');
                        break;
                    case 'Pinard':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/6561133263-2120997963');
                        break;
                    case 'Lingerie':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/8046535766-7531738953');
                        break;
                    case 'Colombani':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/1862408720-1222076375');
                        break;
                    case 'Rapine':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/6399501207-2309910533');
                        break;
                    case 'Pierre_petit':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/9416106748-5109974912');
                        break;
                    case 'Cour_Robin':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/7237770507-7666579130');
                        break;
                    case 'Cour_Oratoire_1_':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/6954970359-6996007704');
                        break;
                    case 'Selection_2_':
                    this.goToDetail('http://reseau.lesgrandsvoisins.org:9000/ldp/6164322723-4376675404');
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