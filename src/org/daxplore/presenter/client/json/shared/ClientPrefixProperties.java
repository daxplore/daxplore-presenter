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
package org.daxplore.presenter.client.json.shared;

import org.daxplore.presenter.shared.PrefixProperties;

import com.google.gwt.core.client.JavaScriptObject;

public class ClientPrefixProperties implements PrefixProperties {

	private NativePrefixProperties properties;
	
	protected ClientPrefixProperties() {
		properties = NativePrefixProperties.getPrefixProperties();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getPrefix() {
		return properties.getPrefix();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getSecondaryFlagText() {
		return properties.getSecondaryFlagText();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getTimepointPrimaryText() {
		return properties.getTimepoint0Text();
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public String getTimepointSecondaryText() {
		return properties.getTimepoint1Text();
	}
	
	/**
	 * This class does all the work, but it's wrapped so that we can inject the outer one
	 */
	private final static class NativePrefixProperties extends JavaScriptObject {
		
		protected NativePrefixProperties() {}
		
		public native String getPrefix() /*-{
			return this.prefix;
		}-*/;
		
		public native String getSecondaryFlagText() /*-{
			return this.secondary_flag;
		}-*/;

		public native String getTimepoint0Text() /*-{
			return this.timepoint_0;
		}-*/;
		
		public native String getTimepoint1Text() /*-{
			return this.timepoint_1;
		}-*/;
		
		private static native NativePrefixProperties getPrefixProperties() /*-{
			return $wnd.prefixProperties;
		}-*/;
	}
}
