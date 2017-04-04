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

import org.daxplore.presenter.chart.ChartPanelPresenter;
import org.daxplore.presenter.chart.ChartPanelView;
import org.daxplore.presenter.client.resources.DaxploreConfig;

import com.google.gwt.core.client.GWT;
import com.google.gwt.core.client.Scheduler;
import com.google.gwt.core.client.Scheduler.ScheduledCommand;
import com.google.gwt.event.logical.shared.ResizeEvent;
import com.google.gwt.event.logical.shared.ResizeHandler;
import com.google.gwt.uibinder.client.UiBinder;
import com.google.gwt.uibinder.client.UiField;
import com.google.gwt.user.client.Window;
import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HorizontalPanel;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.google.gwt.user.client.ui.Widget;
import com.google.inject.Inject;

/**
 * The StagePanel is the base widget for the Daxplore client.
 * 
 * <p>It contains all the UI-elements in the page. It handles resizing of all
 * it's sub-widgets if the window is resized.</p>
 */
public class StagePanel extends Composite implements ResizeHandler {
	interface StageUiBinder extends UiBinder<Widget, StagePanel> {/* Empty UiTemplate interface */}
	private static StageUiBinder uiBinder = GWT.create(StageUiBinder.class);

//	@UiField(provided = true)
	protected final PerspectivePanel perspectivePanel;

	@UiField(provided = true)
	protected HorizontalPanel bottomPanel;

	@UiField(provided = true)
	protected DescriptionPanelBottom descriptionPanelBottom;

	@UiField(provided = true)
	protected DescriptionPanelLegend descriptionPanelLegend;
	
	@UiField(provided = true)
	protected final QuestionPanel questionPanel;
	
	@UiField(provided = true)
	protected final ChartPanelView chartPanel;
	
	@UiField(provided = true)
	protected final VerticalPanel sidebarArea;

	@UiField(provided = true)
	protected final SimplePanel legendPanel;

	
	protected int minWidth;
	
	@Inject
	protected StagePanel(PerspectivePanel perspectivePanel, QuestionPanel questionPanel,
			ChartPanelPresenter chartPanelPresenter, DaxploreConfig config, ImageButtonPanel imageButtonPanel,
			ChartTypeOptionsPanel optionsPanel, DescriptionPanelBottom descriptionPanelBottom, DescriptionPanelLegend descriptionPanelLegend) {
		this.perspectivePanel = perspectivePanel;
		this.questionPanel = questionPanel;
		this.chartPanel = chartPanelPresenter.getView();
		this.descriptionPanelBottom = descriptionPanelBottom;
		this.descriptionPanelLegend= descriptionPanelLegend;
		
		bottomPanel = new HorizontalPanel();
		
		sidebarArea = new VerticalPanel();
		
		minWidth = config.stagePanelMinWidth();
		
		legendPanel = new SimplePanel();

		initWidget(uiBinder.createAndBindUi(this));
		
		sidebarArea.insert(imageButtonPanel, 0);
		sidebarArea.insert(optionsPanel, 1);
		
		setStylePrimaryName("daxplore-StagePanel");
		
		exportUpdateWidth();
		
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
	protected void updateWidth() {
		Scheduler.get().scheduleFinally(new ScheduledCommand() {
			@Override
			public void execute() {
				int clientWidth = Window.getClientWidth();
				int questionPanelWidth = questionPanel.getOffsetWidth();
				int sideAreaWidth = sidebarArea.getOffsetWidth();

				int descriptionPanelMinWidth = descriptionPanelBottom.isVisible() ? 230 + 10 + 2 : 0; // min width (set here) + padding + border from css 
				int totalCompontentWidth = questionPanelWidth
						+ bottomPanel.getOffsetWidth()
						- descriptionPanelBottom.getOffsetWidth() + descriptionPanelMinWidth
						+ sideAreaWidth;
				int containerWidth = Math.max(clientWidth, totalCompontentWidth);
				int maxWidth = containerWidth - questionPanelWidth - sideAreaWidth;
				
				chartPanel.setMaxWidth(maxWidth); 
			}
		});
	}
	
	protected native void exportUpdateWidth() /*-{
		var that = this;
		$wnd.gwtUpdateWidth = $entry(function(perspective, options, total) {
			that.@org.daxplore.presenter.client.ui.StagePanel::updateWidth();
		});
	}-*/;
	
	/**
	 * Set legend to display beside chart. Generated by the chart, injected here.
	 */
	public void setLegend(Widget legend) {
		legendPanel.setWidget(legend);
		updateWidth();
	}
	
	public void setDescription(String questionID, String perspectiveID) {
		descriptionPanelBottom.setDecription(questionID, perspectiveID);
		descriptionPanelLegend.setDecription(questionID, perspectiveID);
	}
}
