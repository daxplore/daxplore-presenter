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
package org.daxplore.presenter.client.resources;

import com.google.gwt.i18n.client.Messages;

/**
 * An interface that supplies internationalized texts to the client UI.
 */
public interface UITexts extends Messages {

	// QuestionPanel
	String pickAQuestionHeader();

	// SelectPanel
	String pickSelectionGroupHeader();

	// CheckboxPanel
	String pickSelectionAlternativesHeader();

	String compareWithAll(); // check box option

	// General page warnings
	String hideWarningButton();

	String ownLangaugeCode();

	String otherLangaugeCode();

	String cookiesDisabledOwnLanguageWarning();

	String cookiesDisabledOtherLanguageWarning();
	
	// ImageButtonPanel
	String printButtonTitle();
	String csvButtonTitle();
	String embedButtonTitle();
	
	// EmbedTextPopup
	String embedPopupTitle();
	String embedPopupDescription();
	String embedPopupTitleSize(String currentSize);
	String embedButtonTexts();
	String embedButtonNumbers(int width, int height);
	String embedSettingsHeader();
	String embedTransparentBackground();
	String embedShowLegend();
	
	// OptionsPanel buttons
	String onlyShowNew();
	String onlyShowNewTitleEnabled();
	String onlyShowNewTitleDisabled();
	String compareWithOld();
	String compareWithOldTitleEnabled();
	String compareWithOldTitleDisabled();
	String showFrequency();
	String showFrequencyTitleEnabled();
	String showFrequencyTitleDisabled();
	String showAverage();
	String showAverageTitleEnabled();
	String showAverageTitleDisabled();
	
}
