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
package org.daxplore.presenter.server.throwable;

import java.util.Locale;

import javax.servlet.ServletContext;

import org.daxplore.presenter.server.ServerTools;

/**
 * An Exception thrown by
 * {@link ServerTools#getResourceReader(ServletContext, String, Locale, String)}
 * when unable to return a reader.
 */
@SuppressWarnings("serial")
public class ResourceReaderException extends Exception {

	/**
	 * Instantiates a new resource reader exception with an error message.
	 * 
	 * @param message
	 *            the message
	 */
	public ResourceReaderException(String message) {
		super(message);
	}

	/**
	 * Instantiates a new resource reader exception, that wraps another
	 * error or exception.
	 * 
	 * @param cause
	 *            the causing error or exception
	 */
	public ResourceReaderException(Throwable cause) {
		super(cause);
	}

	/**
	 * Instantiates a new resource reader exception that contains both
	 * an error message and wraps another error or exception.
	 * 
	 * @param message
	 *            the message
	 * @param cause
	 *            the original error or exception
	 */
	public ResourceReaderException(String message, Throwable cause) {
		super(message, cause);
	}
}
