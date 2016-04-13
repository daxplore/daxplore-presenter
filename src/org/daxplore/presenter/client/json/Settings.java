/**
 *  This file is part of Daxplore Presenter.
 *
 *  Daxplore Presenter is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 2.1 of the License, or
 *  (at your option) any later version.
 *
 *  Daxplore Presenter is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Daxplore Presenter.  If not, see <http://www.gnu.org/licenses/>.
 */
package org.daxplore.presenter.client.json;

import com.google.gwt.core.client.JavaScriptObject;

public class Settings {
	
	public enum DescriptionPosition {
		NONE, BOTTOM, LEGEND, PERSPECTIVE
	}
	
	public static boolean getBool(String name) {
		return SettingsNative.getBool(name);
	}
	
	public static int getInt(String name) {
		return SettingsNative.getInt(name);
	}
	
	public static double getDouble(String name) {
		return SettingsNative.getDouble(name);
	}
	
	public static String getString(String name) {
		return SettingsNative.getString(name);
	}

	
	public static DescriptionPosition getQuestionDescriptionPosition() {
		try {
			return DescriptionPosition.valueOf(SettingsNative.getString("questionDescriptionPosition"));
		} catch (IllegalArgumentException|NullPointerException e) {
			e.printStackTrace(); // TODO log
			return DescriptionPosition.NONE;
		}
	}

	public static DescriptionPosition getPerspectiveDescriptionPosition() {
		try {
			return DescriptionPosition.valueOf(SettingsNative.getString("perspectiveDescriptionPosition"));
		} catch (IllegalArgumentException|NullPointerException e) {
			e.printStackTrace(); // TODO log
			return DescriptionPosition.NONE;
		}
	}
	
	private static class SettingsNative extends JavaScriptObject {
		protected SettingsNative() {}
		
		public static final native boolean getBool(String name) /*-{
			return $wnd.settings[name];
		}-*/;
	
		public static final native int getInt(String name) /*-{
			return $wnd.settings[name];
		}-*/;
	
		public static final native double getDouble(String name) /*-{
			return $wnd.settings[name];
		}-*/;
		
		public static final native String getString(String name) /*-{
			return $wnd.settings[name];
		}-*/;
	}
}
