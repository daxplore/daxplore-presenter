/*
 *  Copyright 2012 Axel Winkler, Daniel Dunér
 * 
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.admin.view;

import java.util.LinkedList;
import java.util.List;

import com.google.gwt.cell.client.TextCell;
import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.Scheduler;
import com.google.gwt.core.client.Scheduler.ScheduledCommand;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.uibinder.client.UiTemplate;
import com.google.gwt.user.cellview.client.CellList;
import com.google.gwt.user.cellview.client.HasKeyboardSelectionPolicy.KeyboardSelectionPolicy;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Button;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.Widget;
import com.google.gwt.view.client.SelectionChangeEvent;
import com.google.gwt.view.client.SingleSelectionModel;
import com.google.inject.Inject;

public class PrefixListViewImpl extends Composite implements PrefixListView {
	
	@UiTemplate("PrefixListViewImpl.ui.xml")
	interface PrefixListViewPanel extends UiBinder<Widget, PrefixListViewImpl> {}
	private static PrefixListViewPanel uiBinder = GWT.create(PrefixListViewPanel.class);
	
	@UiField(provided=true)
	protected CellList<String> prefixCellList;
	
	@UiField
	protected Button addPrefixButton;
	
	private SingleSelectionModel<String> selectionModel;
	private List<String> prefixList = new LinkedList<String>();
	
	
	@Inject
	public PrefixListViewImpl() {
		TextCell textCell = new TextCell();
		prefixCellList = new CellList<String>(textCell);
		prefixCellList.setKeyboardSelectionPolicy(KeyboardSelectionPolicy.ENABLED);
		selectionModel = new SingleSelectionModel<String>();
		prefixCellList.setSelectionModel(selectionModel);
	    prefixCellList.setRowCount(0, true);
	    
	    initWidget(uiBinder.createAndBindUi(this));
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addAddPrefixClickHandler(ClickHandler handler) {
		addPrefixButton.addClickHandler(handler);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addSelectPrefixHandler(SelectionChangeEvent.Handler handler) {
		selectionModel.addSelectionChangeHandler(handler);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getSelectedPrefix() {
		return selectionModel.getSelectedObject();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String promptForPrefixName() {
		String prefix = Window.prompt("Enter the name for the new prefix.\n\n" +
				"A single word using lowercase letters a-z.", "");
		return prefix;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void alertInvalidPrefix(String prefix) {
		Window.alert("The prefix name '"+prefix+"' is not valid.\n\n" +
				"Make sure to write the prefix as a single word, only using lowercase letters a-z.");
		
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void setPrefixes(final List<String> prefixList) {
		this.prefixList = prefixList;
		// Do it deferred due to strange bug when changing list size from 2 to 1
		Scheduler.get().scheduleDeferred(new ScheduledCommand() {
			@Override
			public void execute() {
				prefixCellList.setRowData(prefixList);
			}
		});
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void selectPrefix(String prefix) {
		selectionModel.setSelected(prefix, true);
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public Widget asWidget() {
		return this;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public boolean containsPrefix(String prefix) {
		return prefixList.contains(prefix);
	}
}
