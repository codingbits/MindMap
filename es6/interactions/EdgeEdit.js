"use strict";

load.provide("mm.interactions.EdgeEdit", (function() {
	let Interaction = load.require("mm.interactions.Interaction");
	let textGen = load.require("mm.textGen");
	
	return class EdgeEdit extends Interaction {
		constructor(interactor, abstractGraph, editor) {
			super(interactor, abstractGraph, editor);
			
			this._editingEdge = null;
			this._editingBackup = null;
			this._changingType = false;
		}
		
		async addEdge(renderer, joint, edge) {
			Interaction.prototype.addEdge.call(this, renderer, joint, edge);
			
			let svgNode = renderer.getSvgEdge(edge.id);
			
			if(this._editor) $(svgNode).on("click", (e) => {
				if(this._editingEdge) return;
				let panel = $(svgNode).parents(".mm-root").find(".mm-details-panel");
				this._interactor.loadDetails(edge, renderer, true, true, true, this._cancel.bind(this, renderer));
				this._setEditing(edge);
				panel.find("input").first().focus();
				e.preventDefault();
				e.stopPropagation();
			});
		}
		
		async addCanvas(renderer, node) {
			// ----
			// Edit and save buttons
			// ----
			$(node).find(".mm-details-edit-arrow-save").click((e) => {
				this._interactor.hideDetailsPanel(renderer, true);
				e.preventDefault();
				this._editor.addToUndoStack("edge_edit",
					{id:this._editingEdge.id, old:this._editingBackup, "new":this._editingEdge.toJson()}
				);
				this._editingEdge = null;
			});
			
			let cancel = () => {
				if(!this._editingEdge) return;
				this._interactor.hideDetailsPanel(renderer, true);
				
				if(this._editingBackup.type != this._editingEdge.type.name) {
					this._editingEdge.update(this._editingBackup);
					this._interactor.rerender();
				}else{
					this._editingEdge.update(this._editingBackup);
					this._edges.get(this._editingEdge.id)[1].label(0, {position:0.5, attrs:{text:{text:this._editingEdge.text}}});
				}
				
				this._editingEdge = null;
			};
			
			$(node).find(".mm-details-edit-arrow-close").click(
				(e) => {this._interactor.hideDetailsPanel(renderer, true); e.preventDefault()}
			);
			
			//$(node).on("click", (e) => {if(e.target.classList[0] == "mm-background-grid") cancel(e)});
			
			
			// ----
			// Edge deletion
			// ----
			$(node).find(".mm-details-edit-arrow-delete").click((e) => {
				this._interactor.hideDetailsPanel(renderer, true);
				e.preventDefault();
				
				this._editor.addToUndoStack("node_delete", {id:this._editingEdge.id, json:this._editingBackup});
				this._abstractGraph.objects.removeEdge(this._editingEdge.id);
				
				this._interactor.rerender();
				
				this._editingEdge = null;
			});
			
			
			// ----
			// Edge editing
			// ----
			if(this._editor) $(node).find(".mm-details-edit-arrow").on("input", (e) => {
				let editing = this._editingEdge.id;
				
				let update = {
					text:$(node).find(".mm-details-edit-arrow-text").val(),
					type:$(node).find(".mm-details-edit-arrow-type").val()
				};
				
				// Now check if the type has changed
				let oldTypeName = this._editingEdge.type.name;
				this._editingEdge.update(update);
				if(this._editingEdge.type.name != oldTypeName) {
					this._changingType = true;
					this._interactor.rerender();
					this._interactor.loadDetails(this._editingEdge, renderer, true, true, true, this._cancel.bind(this, renderer));
					this._changingType = false;
				}else{
					this._edges.get(+editing)[1].label(0, {position:0.5, attrs:{text:{text:this._editingEdge.text}}});
				}
			});
		}
		
		_setEditing(edge) {
			this._editingEdge = edge;
			this._editingBackup = edge.toJson();
		}
		
		_cancel(renderer) {
			console.log("Edge cancel called "+this._changingType);
			if(!this._editingEdge) return;
			if(this._changingType) return;
			
			if(this._editingBackup.type != this._editingEdge.type.name) {
				this._editingEdge.update(this._editingBackup);
				this._interactor.rerender();
			}else{
				this._editingEdge.update(this._editingBackup);
				this._edges.get(this._editingEdge.id)[1].label(0, {position:0.5, attrs:{text:{text:this._editingEdge.text}}});
			}
			
			this._editingEdge = null;
		};
	};
})());
