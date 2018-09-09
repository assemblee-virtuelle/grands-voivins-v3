Polymer({
    is: 'semapps-map-wrapper',

    // Wait all HTML to be loaded.
    attached() {

        SemAppsCarto.ready(this.start.bind(this));
    },

    start() {
        "use strict";

        
        this.axo = this.querySelector('semapps-axo');
        this.btnAxo = this.querySelector('#switch-axo');
        this.btnImg = this.btnAxo.querySelector('img');
        // $('#semapps-map-wrapper').css({ 'height': $(window).height() });
        // $(window).on('resize', function() {
        //     $('#semapps-map-wrapper').css({ 'height': $(window).height() });
        //     $('body').css({ 'width': $(window).width() })
        // });
    },

    axoReady(){
        let axoStatus = true;
        $(this.btnAxo).on('click', e => {
            this.map = this.querySelector('semapps-map');
            if (axoStatus == true){
                this.axo.style.display = "none";
                this.map.style.display = "block";
                this.OSM.invalidateSize();
                this.btnImg.setAttribute("src", "/common/images/plan.jpg");
                axoStatus = false;
            } else {
                this.axo.style.display = "block";
                this.map.style.display = "none";
                axoStatus = true;
                this.btnImg.setAttribute("src", "/common/images/france.png");
            }
        })
    },

    setOSM(osm){
        this.OSM = osm;
        console.log(this.OSM);
        let axoStatus = false;
    },

    handleClick(e) {
        e.preventDefault();
        semapps.scrollToContent();
        semapps.myRoute = "detail";
        semapps.goToPath('detail', {
            uri: window.encodeURIComponent(this.uri)
        });
    },


});
