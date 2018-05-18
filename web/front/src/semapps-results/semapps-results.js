Polymer({
    is: 'semapps-results',
    properties: {
        tabFirst: {
            type: Object,
            value: {
                type: 'all',
                plural: 'Tous',
                icon: 'list'
            }
        },
        typeSelected: {
            type: String
        },
        resultsTitle: {
            type: String
        },
        resultTitle: {
            type: String
        },
        tabs: {
            type: Array,
            value: []
        },
        tabsRegistry: {
            type: Object,
            value: {}
        },
        results: {
            type: Array,
            value: []
        },
        otherArray: {
            type: Array,
            value: []
        },
        searchLastTerm: {
            type: String,
            value: null
        },
        route: {
            type: Object,
            observer: '_routeChanged'
        }
    },

    attached() {
        "use strict";
        semapps.results = this;
        this.domSearchResults = semapps.domId('searchResults');
        this.domLoadingSpinner = semapps.domId('searchLoadingSpinner');
        this.$searchThemeFilter = $('#searchThemeFilter');
        // Wait global settings.
        SemAppsCarto.ready(() => {
            let tabs = [];
            let typeSel = '';
            $.each(semapps.entities, (type, data) => {
                data.counter = 0;
                typeSel = (typeSel == '') ? type : typeSel;
                tabs.push(data);
            });
            this.tabs = tabs;
            // Activate first tab by default.
            this.selectType(typeSel);
        });
    },

    tabRegister(type, component) {
        "use strict";
        this.tabsRegistry[type] = component;
        // Refresh selected tab.
        this.selectType(this.typeSelected);
    },

    selectType(tab)  {
        "use strict";
        this.selection(tab);
        // Render results.
        this.searchRender();
    },

    _routeChanged: function (data) {
        // We are on the search mode.
        if (data.prefix === '/rechercher') {
            // semapps.map.zoomGlobal();
            // Route change may be fired before init.
            window.SemAppsCarto.ready(() => {
                let split = data.path.split('/');
                //log(split)
                this.search(split[1]);
            });
        }
    },

    callsearch(ev){
        let checkbox = $(document.getElementById("isGV"));
        checkbox.toggleClass('checked');
        this.searchRender();
    },

    search(term, building) {
        "use strict";
        let filterUri = this.$searchThemeFilter.val();

        // Term and has not changed.
        if (semapps.searchLastTerm === term &&
            // Filter has not changed.
            semapps.searchLastFilter === filterUri) {
            // (maybe building changed).
            this.searchRender();
            return;
        }
        // Cleanup term to avoid search errors.
        semapps.searchLastTerm =
            term = (term || '').replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
        // Save filter.
        semapps.searchLastFilter = filterUri;
        this.searchError =
            this.noResult = false;
        // Empty page.
        this.results = [];
        // Show spinner.
        this.domLoadingSpinner.style.display = 'block';
        // Build callback function.
        let complete = (data) => {
            this.domLoadingSpinner.style.display = 'none';
            this.searchRender(data.responseJSON);
        };
        // Say that this function is the
        // only one we expect to be executed.
        // It prevent to parse multiple responses.
        this.searchQueryLastComplete = complete;
        semapps.ajax('webservice/search?' +
            'term=' + encodeURIComponent(term) +
            '&filter=' + encodeURIComponent(semapps.searchLastFilter), (data) => {
            "use strict";
            // Check that we are on the last callback expected.
            complete === this.searchQueryLastComplete
            // Continue.
            && complete(data);
        });
    },

    searchRender(response) {
        "use strict";
        let results = [];
        // Reset again if just rendering fired.
        this.searchError =
            this.noResult = false;
        this.results.length = 0;
        this.set('results', []);
        let totalCounter = 0;
        let typesCounter = {};
        let resultTemps = {};
        // Allow empty response.
        response = response || this.renderSearchResultResponse || {};
        // Save last data for potential reload.
        this.renderSearchResultResponse = response;

        if (response.error) {
            this.searchError = true;
        }
        else if (response.results) {
            semapps.map.pinHideAll();

            for (let result of response.results) {
                // Data is allowed.
                if(semapps.entities[result.type]){
                    // log(result.type);
                    typesCounter[result.type] = typesCounter[result.type] || 0;
                    typesCounter[result.type]++;
                    totalCounter++;
                    if (typeof resultTemps[result.type] === 'undefined')
                        resultTemps[result.type] = [];
                    resultTemps[result.type].push(result);
                    // log(resultTemps);
                    if(result["address"]){
                        if( semapps.map.pins[result["uri"]] === undefined){
                            semapps.getAddressToCreatePoint(result["address"],result["title"],result["type"],result["uri"]);
                        }
                        else{
                            semapps.map.pinShow(result["uri"]);
                        }
                    }
                }
            }
            
            this.resultsTitle = '';
            // semapps.map.pinShowAll();
            if(typeof resultTemps[this.typeSelected] === 'undefined' ){
                // Deselect tab if current.
                let key = Object.keys(resultTemps)[0];
                this.selection(key);
                results =(typeof resultTemps[this.typeSelected] !== 'undefined' )? resultTemps[Object.keys(resultTemps)[0]] : [];
            }
            else{
                this.otherArray = [];
                results = this.filterNonGrandVoisins(resultTemps[this.typeSelected]);
            }

            if(this.typeSelected === "http://virtual-assembly.org/pair#Organization"){
                this.set('orga', true);
            } else {
                this.set('orga', false);
            }

            // Create title.
            // Results number.

            // Display title.
            //this.resultsTitle = resultsTitle;
            this.resultsTitle += (results.length) ? results.length + ' résultats ' : 'Aucun résultat  ';
            // Display no results section or not.
            this.noResult = results.length === 0;

        }

        this.tabsRegistry.all && (this.tabsRegistry.all.counter = totalCounter);
        for (let entity in semapps.entities){
            this.tabsRegistry[entity] && (this.tabsRegistry[entity].counter = typesCounter[entity] || 0);
        }
        setTimeout(() => {
            if(this.otherArray.length != 0){
                this.set('otherArray', this.otherArray);
            }
            this.set('results', results);
        }, 100);
    },

    selection(val){
        if (this.typeSelected && this.tabsRegistry[val]) {
            this.tabsRegistry[this.typeSelected].$$('li').classList.remove('active');
        }
        // Save.
        this.typeSelected = val;
        // It may not be already created.
        if (this.tabsRegistry[val]) {
            this.tabsRegistry[val].$$('li').classList.add('active');
        }
    },

    filterNonGrandVoisins(results){ //TODO: A faire de maniere plus generique
        let isgv = true;
        let filter = document.getElementById("orgaGvFilter");
        let checkbox = document.getElementById("isGV");

        if ($(checkbox).hasClass('checked') == true){
            isgv = true;

        } else {
            isgv = false;
        }
        this.otherArray = [];        
        if (this.typeSelected === "http://virtual-assembly.org/pair#Organization"){
            filter.style.display = "initial";
            let filteredResults = [];
            let gvArray = [];
            let otherArray = [];
            this.otherArray = [];

            results.forEach((e) => {
                if (e["address"] === "74 Avenue Denfert-Rochereau 75014 Paris" ||
                e["address"] === "72 Avenue Denfert-Rochereau 75014 Paris" ||
                e["address"] === "82 Avenue Denfert-Rochereau 75014 Paris"){
                    e["gv"] = true;
                    gvArray.push(e);
                } else {
                    e["gv"] = false;
                    otherArray.push(e);
                }
            });

            results = gvArray;
            if (isgv === false){
                this.otherArray = otherArray;
            }

        } else{
            filter.style.display = "none";
        }
        this.resultsTitle += (results.length + this.otherArray.length) ? results.length + this.otherArray.length + ' résultats ' : 'Aucun résultat  ';
        document.getElementById("resultstitle").innerHTML = this.resultsTitle; //TODO: a improve
        return results;
    }
});
