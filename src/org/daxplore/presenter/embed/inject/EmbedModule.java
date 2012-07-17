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
package org.daxplore.presenter.embed.inject;

import org.daxplore.presenter.chart.display.ChartFactory;
import org.daxplore.presenter.chart.resources.ChartConfig;
import org.daxplore.presenter.client.json.shared.QuestionMetadataClientImpl;
import org.daxplore.presenter.embed.EmbedEntryPoint;
import org.daxplore.presenter.embed.EmbedQuery.EmbedQueryFactory;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.inject.client.AbstractGinModule;
import com.google.inject.Singleton;
import com.google.web.bindery.event.shared.EventBus;
import com.google.web.bindery.event.shared.SimpleEventBus;

/**
 * Define which classes should be handles by the injection system for
 * {@link EmbedEntryPoint}.
 * 
 * <p>Use {@link EmbedInjector} to get the few first classes.</p>
 * 
 * <p>The injection system will automatically supply the classes with all the
 * injection-input they need to be instantiated. This allows constructors to be
 * injected with a large number of arguments without adding any complexity.</p>
 * 
 * <p>See the <a href=https://code.google.com/p/google-gin/>Google Gin
 * website</a> for more information and motivation.</p>
 */
public class EmbedModule extends AbstractGinModule {

	@Override
	protected void configure() {
		/* client */
		bind(EmbedQueryFactory.class).in(Singleton.class);

		/* client.chart.display */
		bind(ChartFactory.class).in(Singleton.class);

		/* client.json */
		bind(QuestionMetadata.class).to(QuestionMetadataClientImpl.class).in(Singleton.class);
		
		/* client.resources */
		bind(ChartConfig.class).in(Singleton.class);

		/* com.google.web.bindery.event.shared */
		bind(EventBus.class).to(SimpleEventBus.class).in(Singleton.class);
	}
}
