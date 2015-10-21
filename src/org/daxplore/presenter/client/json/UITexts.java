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
package org.daxplore.presenter.client.json;

import com.google.gwt.core.client.JavaScriptObject;
import com.google.inject.Inject;

/**
 * Supplies internationalized texts to the client UI.
 */
public class UITexts {
	private NativeUITexts nativeTexts;
	
	@Inject
	public UITexts() {
		nativeTexts = getNativeUITexts();
	}
	
	// Page Title
	public String pageTitle() {return get("pageTitle");}
	
	// QuestionPanel
	public String pickAQuestionHeader() {return get("pickAQuestionHeader");}
	public String secondaryFlag() {return get("secondaryFlag");}

	// SelectPanel
	public String pickSelectionGroupHeader() {return get("pickSelectionGroupHeader");}

	// CheckboxPanel
	public String pickSelectionAlternativesHeader() {return get("pickSelectionAlternativesHeader");}
	// check box option
	public String compareWithAll() {return get("compareWithAll");} 

	// General page warnings
	public String hideWarningButton() {return get("hideWarningButton");}
	
	// ImageButtonPanel
	public String printButtonTitle() {return get("printButtonTitle");}
	public String csvButtonTitle() {return get("csvButtonTitle");}
	public String embedButtonTitle() {return get("embedButtonTitle");}
	
	// EmbedTextPopup
	public String embedPopupTitle() {return get("embedPopupTitle");}
	public String embedPopupDescription() {return get("embedPopupDescription");}
	public String embedPopupTitleSize(String currentSize) {return get("embedPopupTitleSize", currentSize);}
	public String embedButtonTexts() {return get("embedButtonTexts");}
	public String embedButtonNumbers(int width, int height) {return get("embedButtonNumbers", ""+width, ""+height);}
	public String embedSettingsHeader() {return get("embedSettingsHeader");}
	public String embedTransparentBackground() {return get("embedTransparentBackground");}
	public String embedShowLegend() {return get("embedShowLegend");}
	
	// OptionsPanel buttons
	public String onlyShowNew() {return get("onlyShowNew", timepointPrimary());}
	public String onlyShowNewTitleEnabled() {return get("onlyShowNewTitleEnabled", timepointPrimary());}
	public String onlyShowNewTitleDisabled() {return get("onlyShowNewTitleDisabled", timepointPrimary());}
	public String compareWithOld() {return get("compareWithOld", timepointSecondary());}
	public String compareWithOldTitleEnabled() {return get("compareWithOldTitleEnabled", timepointSecondary(), timepointPrimary());}
	public String compareWithOldTitleDisabled() {return get("compareWithOldTitleDisabled", timepointSecondary());}
	public String showFrequency() {return get("showFrequency");}
	public String showFrequencyTitleEnabled() {return get("showFrequencyTitleEnabled");}
	public String showFrequencyTitleDisabled() {return get("showFrequencyTitleDisabled");}
	public String showAverage() {return get("showAverage");}
	public String showAverageTitleEnabled() {return get("showAverageTitleEnabled");}
	public String showAverageTitleDisabled() {return get("showAverageTitleDisabled");}
	
	// Timepoints
	public String timepointPrimary() {return get("timepoint0");}
	public String timepointSecondary() {return get("timepoint1");}
	
	private String get(String key) {
		String text = nativeTexts.getText(key);
		return (text != null) ? text : "";
	}

	private String get(String key, String val1) {
		String text = nativeTexts.getText(key);
		if(text == null) {
			return "";
		}
		return text.replace("{0}", val1);
	}
	
	private String get(String key, String val1, String val2) {
		String text = nativeTexts.getText(key);
		if(text == null) {
			return "";
		}
		return text.replace("{0}", val1).replace("{1}", val2);
	}
	
	public static native NativeUITexts getNativeUITexts() /*-{
		return $wnd.usertexts;
	}-*/;
	
	private static class NativeUITexts extends JavaScriptObject {
		protected NativeUITexts() {}
		
		public final native String getText(String key) /*-{
			return this[key];
		}-*/;
	}
	
}
