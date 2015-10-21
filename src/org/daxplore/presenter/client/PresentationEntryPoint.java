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
package org.daxplore.presenter.client;

import org.daxplore.presenter.client.inject.PresentationInjector;
import org.daxplore.presenter.client.json.UITexts;
import org.daxplore.presenter.client.ui.StagePanel;

import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.core.client.GWT;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.RootPanel;

/**
 * Entry point for the default view of the project.
 * 
 * <p>It is created automatically by GWT in order to create the webpage.</p>
 * 
 * <p>This entry point creates a page that contains perspectives for questions
 * and perspective and the chart.</p>
 * 
 * <p>Used together with Presentation.gwt.xml and presentation template.</p>
 */
public class PresentationEntryPoint implements EntryPoint {

	private final PresentationInjector injector = GWT.create(PresentationInjector.class);

	/**
	 * This is the entry point method. It is automatically called by GWT to
	 * create the web page.
	 */
	@Override
	public void onModuleLoad() {
		RootPanel rootPanel = RootPanel.get("ID-StagePanel");
		StagePanel stagePanel = injector.getStagePanel();
		rootPanel.add(stagePanel);
		Presenter presenter = injector.getPresenter();
		String href = Window.Location.getHref();
		if (href.contains("#")) {
			String base64 = href.substring(href.lastIndexOf("#") + 1, href.length());
			presenter.restore(base64, true);
		} else {
			presenter.showDefaultChart();
		}
	}
}
