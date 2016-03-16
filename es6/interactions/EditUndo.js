"use strict";

load.provide("mm.interactions.EditUndo", (function() {
	let Interaction = load.require("mm.interactions.Interaction");
	
	return class EditUndo extends Interaction {
		async addCanvas(renderer, node) {
			$(node).find(".mm-undo-button").click((e) => {
				this._interactor.undo();
			});
			
			$(node).find(".mm-redo-button").click((e) => {
				this._interactor.redo();
			});
		}
	};
}));