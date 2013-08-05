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
package org.daxplore.presenter.admin.presenter;

import java.util.List;

import org.daxplore.presenter.admin.event.PrefixListUpdateEvent;
import org.daxplore.presenter.admin.event.PrefixListUpdateHandler;
import org.daxplore.presenter.admin.event.SelectPrefixEvent;
import org.daxplore.presenter.admin.model.PrefixDataModel;
import org.daxplore.presenter.admin.view.PrefixListView;

import com.google.gwt.event.dom.client.ClickEvent;
import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.ui.HasWidgets;
import com.google.gwt.view.client.SelectionChangeEvent;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;


public class PrefixListPresenter implements Presenter {

	private final EventBus eventBus;
	private final PrefixDataModel model;
	private final PrefixListView display;
	
	private String prefixToBeSelected;
	
	@Inject
	public PrefixListPresenter(EventBus eventBus, PrefixDataModel model, PrefixListView view) {
		this.eventBus = eventBus;
		this.model = model;
		this.display = view;
	}
	
	private void bind() {
		display.addAddPrefixClickHandler(new ClickHandler() {
			@Override
			public void onClick(ClickEvent event) {
				doAddPrefixName();
			}
		});
		
		display.addSelectPrefixHandler(new SelectionChangeEvent.Handler() {
			@Override
			public void onSelectionChange(SelectionChangeEvent event) {
				String prefix = display.getSelectedPrefix();
				eventBus.fireEvent(new SelectPrefixEvent(prefix));
			}
		});
		
		PrefixListUpdateEvent.register(eventBus, new PrefixListUpdateHandler() {
			@Override
			public void onPrefixListUpdate(PrefixListUpdateEvent event) {
				doUpdatePrefixList(event.getPrefixList());
			}
		});
	}
	
	public void doAddPrefixName() {
		String prefix = display.promptForPrefixName();
		
		// Validate user input
		if (prefix == null || prefix.isEmpty()) {
			return;
		}
		prefix = prefix.trim();
		if (!prefix.matches("[a-z]+")) { // TODO Used shared resources regexp for this
			display.alertInvalidPrefix(prefix);
			return;
		}
		
		model.addPrefix(prefix);
		prefixToBeSelected = prefix;
	}
	
	public void doUpdatePrefixList(List<String> prefixList) {
		display.setPrefixes(prefixList);
	    if (prefixToBeSelected!=null && display.containsPrefix(prefixToBeSelected)) {
	    	display.selectPrefix(prefixToBeSelected); // This will fire a SelectionChangeEvent
	    	prefixToBeSelected = null;
	    } else if (prefixList.size() > 0) {
	    	display.selectPrefix(prefixList.get(0)); // This will fire a SelectionChangeEvent
		}
	}
	
	@Override
	public void go(HasWidgets container) {
		bind();
		container.clear();
	    container.add(display.asWidget());
	    
	    model.getPrefixList(); // This will eventually fire a PrefixListUpdateEvent
	}

	public void selectPrefix(String prefix) {
		if(display.containsPrefix(prefix)) {
			display.selectPrefix(prefix); // This will fire a SelectionChangeEvent
		} else {
			prefixToBeSelected = prefix;
			model.getPrefixList(); // This will eventually fire a PrefixListUpdateEvent
		}
	}
}
