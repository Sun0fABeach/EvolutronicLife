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
    // TODO plant trees need to toggle

    function make_token_toggler() {
        let toggle = 0;
        return (_, tokens) => {
            const idx = toggle;
            toggle = toggle === tokens.length-1 ?  0 : toggle + 1;
            return tokens[idx];
        }
    }

    function token_by_level(entity, tokens) {
        return tokens[entity.level];
    }

    function constant_token(_, tokens) {
        return tokens[0];
    }

    const mapping = new Map([
        [Herbivore,     { tokens: 'җҖӜ',    get_token: token_by_level }],
        [Carnivore,     { tokens: 'ԅԇʡ',    get_token: token_by_level }],
        [Plant,         { tokens: 'ʷʬϒY',   get_token: token_by_level }],
        [RainForest,    { tokens: 'Ϋϔ',     get_token: make_token_toggler() }],
        [Water,         { tokens: '∽~',     get_token: make_token_toggler() }],
        [Protozoan,     { tokens: '§',      get_token: constant_token }],
        [Beach,         { tokens: ':',      get_token: constant_token }]
    ]);

    function token_to_entity(symbol) {
        for(const [constr, display] of mapping.entries()) {
            const found_idx = display.tokens.indexOf(symbol);
            if(found_idx >= 0)
                return constr.instance || new constr(null, found_idx);
                /* some entities are handled as one shared instance as a
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
        return {token: ' ', css_class: undefined};
    }

    function parse_initial_map(map) {
        return map.map(
            line => line.split('').map(token => token_to_entity(token))
        );
    }

    function build_html_map(entity_map) {
        const html_map = document.createElement("pre");
        for(const ent_row of entity_map) {
            for(const ent of ent_row) {
                const span = document.createElement("span");
                const {token, css_class} = entity_to_token(ent);
                if(css_class)
                    span.className = css_class;
                span.appendChild(document.createTextNode(token));
                html_map.appendChild(span);
            }
            html_map.appendChild(document.createTextNode('\n'));
        }
        return html_map;
    }

    return { parse_initial_map, build_html_map };
}();
