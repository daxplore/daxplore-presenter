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
package org.daxplore.presenter.server.storage;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.files.AppEngineFile;
import com.google.appengine.api.files.FileReadChannel;
import com.google.appengine.api.files.FileService;
import com.google.appengine.api.files.FileServiceFactory;
import com.google.appengine.api.files.FileWriteChannel;
import com.google.appengine.api.files.LockException;

/**
 * @author ladu5359
 *
 */
public class StorageTools {

	public static BlobKey writeBlob(String fileName, byte[] data) throws IOException {
		FileService fileService = FileServiceFactory.getFileService();
		AppEngineFile file = fileService.createNewBlobFile("application/octet-stream", fileName);
		FileWriteChannel writeChannel = fileService.openWriteChannel(file, true);
		BufferedInputStream in = new BufferedInputStream(new ByteArrayInputStream(data));
	    byte[] buffer = new byte[BlobstoreService.MAX_BLOB_FETCH_SIZE]; //fetch size apparently works for writing as well
	    int read;
	    while((read = in.read(buffer)) > 0){
	        writeChannel.write(ByteBuffer.wrap(buffer, 0, read));
	    }
		writeChannel.closeFinally();
	    return fileService.getBlobKey(file);
	}
	
	public static byte[] readBlob(BlobKey blobKey) throws IOException {
		FileService fileService = FileServiceFactory.getFileService();
		AppEngineFile file = fileService.getBlobFile(blobKey);
		FileReadChannel readChannel = null;
		try {
			readChannel = fileService.openReadChannel(file, false);
			InputStream input = Channels.newInputStream(readChannel);
			ByteArrayOutputStream output = new ByteArrayOutputStream();
			long count = IOUtils.copyLarge(input, output, new byte[BlobstoreService.MAX_BLOB_FETCH_SIZE]);
	        if (count > Integer.MAX_VALUE) {
	            throw new IOException("Failed to read blobstore entry");
	        }
	        return output.toByteArray();
		} catch (LockException e) {
			throw new IOException(e);
		} catch (FileNotFoundException e) {
			throw new IOException(e);
		} finally {
			if (readChannel != null) {
				readChannel.close();
			}
		}
	}
	
	public static void deleteBlob(BlobKey blobKey) {
		BlobstoreServiceFactory.getBlobstoreService().delete(blobKey);
	}

}
