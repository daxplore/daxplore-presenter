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
package org.daxplore.presenter.admin.model;

import java.util.Arrays;
import java.util.List;

/**
 * The PrefixList model is responsible for editing the prefix list on the server
 * and fetching existing prefixes.
 */
public class PrefixListModelImpl implements PrefixListModel {

	/**
	 * {@inheritDoc}
	 */
	@Override
	public List<String> getPrefixList() {
		// TODO Auto-generated method stub
		return Arrays.asList("a", "b", "c");
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void addPrefix(String prefix) {
		// TODO Auto-generated method stub
		
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void deletePrefix(String prefix) {
		// TODO Auto-generated method stub
		
	}

}
