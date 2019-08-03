/**
 * The translator is responsible for parsing the initial map in order to set
 * up the internal game logic data structures, as well as building an html map
 * based on these structures. It can be seen as an interface layer that handles
 * translations between internal game logic and the graphical display.
 * @module translator
 * @requires entities
 */

import entities from './entities';

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
        [entities.Herbivore,  { tokens: 'җҖӜ',  get_token: token_by_level }],
        [entities.Carnivore,  { tokens: 'ԅԇʡ',  get_token: token_by_level }],
        [entities.Plant,      { tokens: 'ʷʬYϒ', get_token: plant_token }],
        [entities.RainForest, { tokens: 'Ϋϔ',   get_token: token_toggler }],
        [entities.Water,      { tokens: '∽~',   get_token: token_toggler }],
        [entities.Protozoan,  { tokens: '§',    get_token: constant_token }],
        [entities.Beach,      { tokens: ':',    get_token: constant_token }]
    ]);

    /**
     * Return instance of an entity represented by the given token.
     * @method token_to_entity
     * @private
     * @param {String} symbol Token representing an entity
     * @return {Entity} Instance of an entity represented by the given token,
     *                  or *null*, if token is unknown.
     */
    function token_to_entity(symbol) {
        for(const [klass, display] of mapping.entries()) {
            const found_idx = display.tokens.indexOf(symbol);
            if(found_idx >= 0)
                return klass.instance || new klass(null, found_idx);
                /* some entities can be handled as one shared instance as a
                   memory optimization */
        }
        return null;
    }

    /**
     * Return an object containing display information for the given entity.
     * @method entity_to_token
     * @param {Entity} entity Instance of an entity
     * @return {Object} Display information for given entity (token, css class).
     */
    function entity_to_token(entity) {
        if(entity)
            for(const [klass, display] of mapping.entries())
                if(entity instanceof klass)
                    return {
                        token: display.get_token(entity, display.tokens),
                        css_class: klass.name.toLowerCase()
                    };
        return {token: ' ', css_class: ''};
    }

    /**
     * Build an entity map out of a token map.
     * @method parse_initial_map
     * @param {Array} map 2D array representing a token map
     * @return {Array} 2D array containing entity instances.
     */
    function parse_initial_map(map) {
        return map.map(
            line => line.split('').map(token => token_to_entity(token))
        );
    }

    /**
     * Build HTML string representing a token map out of the given entity map.
     * @method build_html_map
     * @param {Array} entity_map 2D array containing entities
     * @param {Boolean} do_toggle True if token toggling shall happend when
     *                            constructing the map, false otherwise.
     * @param {Number} [tracked_idx=undefined] Index n of the entity to
     *                 highlight as in child number n of its parent node.
     *                 *undefined* if there is no entity to highlight.
     * @return {Array} HTML string representing a token map to be displayed
     *                 by inserting it into the DOM.
     */
    function build_html_map(entity_map, do_toggle, tracked_idx=undefined) {
        if(do_toggle)
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

export default translator;
