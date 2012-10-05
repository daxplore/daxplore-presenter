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
package org.daxplore.presenter.server.upload;

import org.daxplore.presenter.server.upload.DataUnpackServlet.UnpackType;

import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;

public class UnpackQueue {

	public void addTask(String datastoreKey, UnpackType type, String channelToken) {
		Queue queue = QueueFactory.getQueue("upload-unpack-queue");
		TaskOptions task = TaskOptions.Builder
				.withUrl("/admin/uploadUnpack")
				.method(TaskOptions.Method.GET)
				.param("key", datastoreKey)
				.param("type", type.toString())
				.param("channel", channelToken);
		queue.add(task);
	}

}
