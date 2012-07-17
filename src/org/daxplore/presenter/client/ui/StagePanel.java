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
package org.daxplore.presenter.client.ui;

import org.daxplore.presenter.chart.ChartPanel;
import org.daxplore.presenter.client.resources.DaxploreConfig;
import org.daxplore.presenter.client.resources.UIResources;

import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.Scheduler;
import com.google.gwt.core.client.Scheduler.ScheduledCommand;
import com.google.gwt.event.logical.shared.ResizeEvent;
import com.google.gwt.event.logical.shared.ResizeHandler;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;

/**
 * The StagePanel is the base widget for the Daxplore client.
 * 
 * <p>It contains all the UI-elements in the page. It handles resizing of all
 * it's sub-widgets if the window is resized.</p>
 */
public class StagePanel extends Composite implements ResizeHandler {
	interface StageUiBinder extends UiBinder<Widget, StagePanel> {}
	private static StageUiBinder uiBinder = GWT.create(StageUiBinder.class);

	@UiField(provided = true)
	protected final PerspectivePanel perspectivePanel;
	
	@UiField(provided = true)
	protected final QuestionPanel questionPanel;
	
	@UiField(provided = true)
	protected final ChartPanel chartPanel;
	
	protected int minWidth;
	
	@Inject
	protected StagePanel(PerspectivePanel perspectivePanel, QuestionPanel questionPanel, ChartPanel chartPanel,
			UIResources uiResources, DaxploreConfig config) {
		this.perspectivePanel = perspectivePanel;
		this.questionPanel = questionPanel;
		this.chartPanel = chartPanel;

		minWidth = config.stagePanelMinWidth();
		
		initWidget(uiBinder.createAndBindUi(this));
		
		setStylePrimaryName("daxplore-StagePanel");
		
		Window.addResizeHandler(this);

		updateWidth();
	}
	
	/**
	 * Update the width when the window is resized.
	 * 
	 * @param event
	 *            the window's resize event
	 */
	@Override
	public void onResize(ResizeEvent event) {
		updateWidth();
	}
	
	/**
	 * Update stage panel width and content to fill up the window.
	 */
	public void updateWidth () {
		Scheduler.get().scheduleFinally(new ScheduledCommand() {
			@Override
			public void execute() {
				int desiredStagePanelWidth = Math.max(minWidth, Window.getClientWidth());
				int widthOfOtherStuff = StagePanel.this.getOffsetWidth() - chartPanel.getOffsetWidth();
				chartPanel.setMaxWidth(desiredStagePanelWidth - widthOfOtherStuff);
			}
		});
	}
}
