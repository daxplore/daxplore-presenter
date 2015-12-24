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
package org.daxplore.presenter.client.grid;

import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.client.json.Perspectives;
import org.daxplore.presenter.client.json.Prefix;
import org.daxplore.presenter.client.json.shared.QuestionMetadataClientImpl;
import org.daxplore.presenter.client.model.StatDataServerModel;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.event.shared.EventBus;
import com.google.gwt.event.shared.SimpleEventBus;
import com.google.gwt.user.client.ui.RootPanel;

/**
 * Entry point for the grid view of the project.
 * 
 * <p>Used together with Grid.gwt.xml and the grid template.</p>
 */
public class GridEntryPoint implements EntryPoint {

	/**
	 * This is the entry point method. It is automatically called by GWT to
	 * create the web page.
	 */
	@Override
	public void onModuleLoad() {
		RootPanel rootPanel = RootPanel.get("ID-StagePanel");
		Prefix prefix = new Prefix();
		EventBus eventBus = new SimpleEventBus();
		StatDataServerModel statDataServerModel = new StatDataServerModel(eventBus, prefix);
		Groups groups = new Groups();
		QuestionMetadata questionMetadata = new QuestionMetadataClientImpl();
		Perspectives perspectives = new Perspectives();
		
		GridPresenter presenter = new GridPresenter(eventBus, statDataServerModel, groups, questionMetadata, perspectives);
		GridView gridView = presenter.getView();
		rootPanel.add(gridView);
	}
}
