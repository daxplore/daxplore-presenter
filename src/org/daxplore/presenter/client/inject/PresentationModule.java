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
package org.daxplore.presenter.client.inject;

import org.daxplore.presenter.chart.ChartPanelPresenter;
import org.daxplore.presenter.chart.ChartPanelView;
import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.display.QueryActiveAnimation;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.chart.resources.ChartResources;
import org.daxplore.presenter.chart.resources.ChartTexts;
import org.daxplore.presenter.client.PresentationEntryPoint;
import org.daxplore.presenter.client.Presenter;
import org.daxplore.presenter.client.event.SelectionUpdateHandler;
import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.client.json.Perspectives;
import org.daxplore.presenter.client.json.Prefix;
import org.daxplore.presenter.client.json.shared.QuestionMetadataClientImpl;
import org.daxplore.presenter.client.json.shared.UITexts;
import org.daxplore.presenter.client.model.StatDataServerModel;
import org.daxplore.presenter.client.ui.ChartTypeOptionsPanel;
import org.daxplore.presenter.client.ui.DescriptionPanelBottom;
import org.daxplore.presenter.client.ui.EmbedPopup;
import org.daxplore.presenter.client.ui.ImageButtonPanel;
import org.daxplore.presenter.client.ui.PerspectiveCheckboxPanel.PerspectiveCheckboxPanelFactory;
import org.daxplore.presenter.client.ui.PerspectivePanel;
import org.daxplore.presenter.client.ui.PerspectiveQuestionsPanel.PerspectiveQuestionsFactory;
import org.daxplore.presenter.client.ui.QuestionPanel;
import org.daxplore.presenter.client.ui.StagePanel;
import org.daxplore.presenter.client.ui.WarningBanner.WarningBannerFactory;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.inject.client.AbstractGinModule;
import com.google.inject.Singleton;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.SimpleEventBus;

/**
 * Define which classes should be handles by the injection system for
 * {@link PresentationEntryPoint}.
 * 
 * <p>Use {@link PresentationInjector} to get the few first classes.</p>
 * 
 * <p>The injection system will automatically supply the classes with all the
 * injection-input they need to be instantiated. This allows constructors to be
 * injected with a large number of arguments without adding any complexity.</p>
 * 
 * <p>See the <a href=https://code.google.com/p/google-gin/>Google Gin
 * website</a> for more information and motivation.</p>
 */
public class PresentationModule extends AbstractGinModule {

	@Override
	protected void configure() {

		/* chart */
		bind(ChartPanelPresenter.class).in(Singleton.class);
		bind(ChartPanelView.class).in(Singleton.class);
		bind(QueryActiveAnimation.class).in(Singleton.class);

		/* chart.display */
		bind(ChartFactory.class).in(Singleton.class);

		/* chart.resources */
		bind(ChartConfig.class).in(Singleton.class);
		bind(ChartResources.class).in(Singleton.class);
		bind(ChartTexts.class).in(Singleton.class);

		/* chart.embed */
		bind(EmbedPopup.class).in(Singleton.class);

		/* client */
		bind(Presenter.class).in(Singleton.class);

		/* client.event */
		bind(SelectionUpdateHandler.class).to(Presenter.class).in(Singleton.class);

		/* client.json */
		bind(Groups.class).in(Singleton.class);
		bind(QuestionMetadata.class).to(QuestionMetadataClientImpl.class).in(Singleton.class);
		bind(Perspectives.class).in(Singleton.class);
		bind(Prefix.class).in(Singleton.class);
		
		bind(StatDataServerModel.class).in(Singleton.class);

		/* client.resources */
		bind(UITexts.class).in(Singleton.class);

		/* client.ui */
		bind(PerspectiveCheckboxPanelFactory.class).in(Singleton.class);
		bind(PerspectiveQuestionsFactory.class).in(Singleton.class);
		bind(WarningBannerFactory.class).in(Singleton.class);
		bind(QuestionPanel.class).in(Singleton.class);
		bind(PerspectivePanel.class).in(Singleton.class);
		bind(StagePanel.class).in(Singleton.class);
		bind(ChartTypeOptionsPanel.class).in(Singleton.class);
		bind(ImageButtonPanel.class).in(Singleton.class);
		bind(DescriptionPanelBottom.class).in(Singleton.class);

		/* com.google.web.bindery.event.shared */
		bind(EventBus.class).to(SimpleEventBus.class).in(Singleton.class);
	}
}
