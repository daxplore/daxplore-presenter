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
package org.daxplore.presenter.chart.resources;

import com.google.gwt.i18n.client.Messages;

/**
 * An interface that supplies internationalized texts to the charts.
 */
public interface ChartTexts extends Messages {
	
	// Chart group name
	String compareWithAll();

	// Chart title text
	String doubleTitle(String title, String subtitle);
	String singleTitle(String title);

	// Chart tick text
	String standardTick(String tickName, int respondentCount);
	String missingTick(String tickName, int respondentCountCutoff);
	String compareTick(String tickName, String timepointPrimary, int respondentCountPrimary, String timepointSecondary, int respondentCountSecondary);
	String compareMissingTick(String tickName, int respondentCountCutoff);
	String compareMissingSecondaryTick(String tickName, String timepointPrimary, int respondentCountPrimary, String timepointSecondary, int respondentCountCutoff);

	// Chart annotation text
	String barChartAnnotation(String answerPercentage, String answerText);
	String barChartNoAnswerAnnotation(String answerText);
	String barChartComparePrimaryAnnotation(String timepoint, String answerPercentage, String answerText);
	String barChartComparePrimaryNoAnswerAnnotation(String timepoint, String answerText);
	String barChartCompareSecondaryAnnotation(String timepoint, String answerPercentage, String answerText);
	String barChartCompareSecondaryNoAnswerAnnotation(String timepoint, String answerText);
	String meanChartAnnotation(String mean);
	String meanChartComparePrimaryAnnotation(String timepoint, String mean);
	String meanChartCompareSecondaryAnnotation(String timepoint, String mean);

	// ExternalChartLegend
	String oneGroupHidden();
	String groupsHidden();
	String oneOptionHidden();
	String optionsHidden();

	// LoadingChartAnimation title and alt texts
	String loadingChart();
	String loadingChartDone();
	
}
