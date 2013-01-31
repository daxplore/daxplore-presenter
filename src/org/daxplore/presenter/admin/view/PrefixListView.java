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
package org.daxplore.presenter.admin.view;

import java.util.List;

import com.google.gwt.event.dom.client.ClickHandler;
import com.google.gwt.user.client.ui.Widget;
import com.google.gwt.view.client.SelectionChangeEvent;

/**
 * The PrefixListView is used to display information to and receive input
 * from the end user.
 */
public interface PrefixListView {
	void addAddPrefixButtonClickHandler(ClickHandler handler);

	String promptForPrefixName();

	void alertInvalidPrefix(String prefix);

	void addSelectPrefixHandler(SelectionChangeEvent.Handler handler);

	String getSelectedPrefix();

	void setPrefixes(List<String> prefixList);

	void selectPrefix(String prefix);

	Widget asWidget();
}