Polymer({
    is: 'semapps-map-gv',
    properties: {
      route: {
        type: Object,
        observer: '_routeChanged'
      },
      pins: {
        type: Array,
        value: []
      },
      pinsRegistry: {
        type: Object,
        value: {}
      }
    },

    attached() {
        this.ready = false;
        this.$gvMap = document.getElementById('semapps-map-gv');
        let groups = this.$gvMap.querySelectorAll("svg > g");
        this.listSelection = [];
        this.listFillers = []; 
        this.legendList = groups[14].children;

        
        groups.forEach(e => {

            if (e.id == "Lingerie"){
                let selection = e.querySelector("[id='Selection_9_'] polygon");
                let fill = e.querySelector("[id='Fill_9_'] polygon")
                if (selection && selection != "" && fill && fill != ""){
                    this.listSelection.push($(selection));
                    this.listFillers.push($(fill));
                }
            }
            else if(e.id == "Cour_de_la_Chapelle_1_") {
                let selection = e.querySelector("[id='Selection_2_'] > g path");
                let fill = e.querySelector("[id='Fill_2_'] > g path")
                if (selection && selection != "" && fill && fill != ""){
                    this.listSelection.push($(selection));
                    this.listFillers.push($(fill));
                }
            } else {
                let selection = e.querySelector("[id^='Selection_'] path");
                let fill = e.querySelector("[id^='Fill_'] path")
                if (selection && selection != "" && fill && fill != ""){
                    this.listSelection.push($(selection));
                    this.listFillers.push($(fill));
                }
            }
        });
        console.log('this.listSelection :', this.listSelection);
        console.log('this.listFillers :', this.listFillers);
        this.hoverActive = true;
        // Global ref.
        semapps.schema = this;

        SemAppsCarto.ready(this.start.bind(this));
    },

    start(){

        // Create pins. 
        let pins = [];
        $.each(semapps.buildings, (building) => {
            pins.push(building);
        });

        this.pins = pins;
        
        let i = 0;
        for (let building in this.listSelection){

            let filler = this.listFillers[i];
            this.listSelection[building].on('mouseover', (e) => {
                console.log("Passing on : ", filler);
                this.hoverActive && this.buildingHighlight(filler[0]);
            })
            .on('mouseout', (e) => {
                this.hoverActive && this.buildingHighlightOff(filler[0]);
            })
            // Click.
            .on('click', (e) => {
                //let key = filler[0].getAttribute('id').split('-')[1];
                // Launch search.
                //this.buildingClick(key);
                // Disable hover temporally.
                this.hoverActive = false;
                // Scroll.
                // semapps.scrollToContent(() => {
                //   "use strict";
                //   this.hoverActive = true;
                // });
            });
            i++;
      }

      //this.buildingSelect(semapps.buildingSelected, false);
    },

    buildingHighlight(key) {
      // Deselect if already selected.
      this.buildingHighlightOff();
      this.mapIsOver = true;
      this.buildingHighlighted = key;
      let zone = this.buildingHighlighted;
      if (zone) {
          console.log('zone :', zone);
        zone.classList.add('strong');
        zone.classList.remove('discreet');
        // Hide all.
        this.buildingHideAll(true);
      }
      else {
        // Display all.
        this.buildingHideAll(false);
      }
    },
  
    buildingHighlightOff() {
      if (this.buildingHighlighted) {
        this.buildingHighlighted.classList.remove('strong');
        delete this.buildingHighlighted;
      }
      if (this.mapTimeout) {
        clearTimeout(this.mapTimeout);
      }
      this.mapIsOver = false;
      this.mapTimeout = setTimeout(() => {
        // Mouse is still not over.
        if (!this.mapIsOver) {
          this.buildingHighlightReset();
        }
      }, 500);
    },
  
    buildingHighlightReset() {
      this.mapTimeout = false;
      this.buildingHideAll(false);
    },
  
    buildingHideAll(activate) {
      // Define add or remove class.
      var method = activate ? 'add' : 'remove';
    //   this.listSelection.each((index, zone) => {
    //     // On all paths.
    //     zone.classList[method]('discreet');
    //   });
    },
  
    buildingClick(building) {
      "use strict";
      // Do not allow building selection and search term in the same time.
        semapps.domSearchTextInput.value = '';
        semapps.schema.buildingSelect(building);
    },
  
    buildingSelect(building, reloadSearch) {
      "use strict";
      // Deselect current.
      this.pinsRegistry[semapps.buildingSelected] && this.pinsRegistry[semapps.buildingSelected].deselect();
      let selected =
          semapps.buildingSelected = building || semapps.buildingSelectedAll;
      // Select new one.
      this.pinsRegistry[selected] && this.pinsRegistry[selected].select();
      // Reload by default.
      (reloadSearch !== false) && semapps.goSearch();
    },
  
    pinShow(building, text) {
      "use strict";
      if(this.pinsRegistry[building] != null)
        this.pinsRegistry[building].show(text);
    },
  
    pinShowOne(building, text) {
      "use strict";
      this.pinHideAll();
      this.pinShow(building, text);
    },
  
    pinHide(building) {
      "use strict";
      if(this.pinsRegistry[building] != null)
       this.pinsRegistry[building].hide();
    },
  
    pinHideAll() {
      "use strict";
      $.each(semapps.buildings, (building) => {
          semapps.schema.pinHide(building);
      });
    }
});