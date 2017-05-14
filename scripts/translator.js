"use strict";

/**
 * The translator is responsible for parsing the initial map in order to set
 * up the internal game logic data structures, as well as building an html map
 * based on these structures. It can be seen as an interface layer that handles
 * translations between internal game logic and the graphical display.
 * @module translator
 * @requires entities
 */

 /**
  * Singleton object containing translator functions.
  * @class translator
  */
const translator = function() {
    let animation_toggle = 0;

    function token_toggler(_, tokens) {
        return tokens[animation_toggle];
    }

    function token_by_level(entity, tokens) {
        return tokens[entity.level];
    }

    function plant_token(plant, tokens) {
        if(plant.level === 2)
            return token_toggler(plant, tokens.slice(2));
        return token_by_level(plant, tokens);
    }

    function constant_token(_, tokens) {
        return tokens[0];
    }

    const mapping = new Map([
        [Herbivore,     { tokens: 'җҖӜ',    get_token: token_by_level }],
        [Carnivore,     { tokens: 'ԅԇʡ',    get_token: token_by_level }],
        [Plant,         { tokens: 'ʷʬYϒ',   get_token: plant_token }],
        [RainForest,    { tokens: 'Ϋϔ',     get_token: token_toggler }],
        [Water,         { tokens: '∽~',     get_token: token_toggler }],
        [Protozoan,     { tokens: '§',      get_token: constant_token }],
        [Beach,         { tokens: ':',      get_token: constant_token }]
    ]);

    function token_to_entity(symbol) {
        for(const [constr, display] of mapping.entries()) {
            const found_idx = display.tokens.indexOf(symbol);
            if(found_idx >= 0)
                return constr.instance || new constr(null, found_idx);
                /* some entities can be handled as one shared instance as a
                   memory optimization */
        }
        return null;
    }

    function entity_to_token(entity) {
        if(entity) {
            for(const [constr, display] of mapping.entries()) {
                if(entity instanceof constr) {
                    return {
                        token: display.get_token(entity, display.tokens),
                        css_class: constr.name.toLowerCase()
                    };
                }
            }
        }
        return {token: ' ', css_class: ''};
    }

    function parse_initial_map(map) {
        return map.map(
            line => line.split('').map(token => token_to_entity(token))
        );
    }

    function build_html_map(entity_map, tracked_idx=undefined) {
        animation_toggle = animation_toggle === 0 ? 1 : 0;
        let element_counter = 0;

        const html_map = document.createElement("pre");
        for(const ent_row of entity_map) {
            for(const ent of ent_row) {
                const span = document.createElement("span");
                const {token, css_class} = entity_to_token(ent);
                if(css_class)
                    span.className = css_class;
                if(element_counter++ === tracked_idx)
                    span.id = "tracked";
                span.appendChild(document.createTextNode(token));
                html_map.appendChild(span);
            }
            html_map.appendChild(document.createTextNode('\n'));
        }
        return html_map;
    }

    return { entity_to_token, parse_initial_map, build_html_map };
}();
