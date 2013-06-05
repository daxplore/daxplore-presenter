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
package org.daxplore.presenter.client.ui;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTMLPanel;
import com.google.gwt.user.client.ui.SimplePanel;
import com.google.gwt.user.client.ui.Widget;

public class WidgetAnchor extends Composite {
	private SimplePanel panel = new SimplePanel();
	private Widget widget;
	

	public WidgetAnchor(String href, Widget widget) {
		this.widget = widget;
		initWidget(panel);
		setHref(href);
	}
	
	public void setHref(String href) {
		HTMLPanel htmlPanel = new HTMLPanel("<a href='" + href + "'><div id='anchor-widget'></div></a>");
		htmlPanel.addAndReplaceElement(widget, "anchor-widget");
		panel.setWidget(htmlPanel);
	}
}
