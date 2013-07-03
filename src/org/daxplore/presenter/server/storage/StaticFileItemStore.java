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
package org.daxplore.presenter.server.storage;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.nio.channels.Channels;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import javax.jdo.PersistenceManager;
import javax.jdo.annotations.PersistenceCapable;
import javax.jdo.annotations.Persistent;
import javax.jdo.annotations.PrimaryKey;

import org.apache.commons.io.IOUtils;
import org.apache.commons.io.output.ByteArrayOutputStream;
import org.daxplore.presenter.server.throwable.BadReqException;
import org.daxplore.presenter.server.throwable.InternalServerException;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.files.AppEngineFile;
import com.google.appengine.api.files.FileReadChannel;
import com.google.appengine.api.files.FileService;
import com.google.appengine.api.files.FileServiceFactory;
import com.google.appengine.api.files.FileWriteChannel;

@PersistenceCapable
public class StaticFileItemStore {
	@PrimaryKey
	private String key;
	@Persistent
	private String blobKey;
	@Persistent
	private String prefix;
	
	private static Map<String, String> staticFileCache = new HashMap<>();

	/**
	 * Instantiate a new static file item, which acts as a pointer to a file
	 * stored in the BlobStore.
	 * 
	 * <p>The key should be in the format "prefix#name". The prefix defines
	 * which presenter the setting belongs to and the name is the name
	 * of the file.</p>
	 * 
	 * @param key
	 *            a key in the format "prefix#name"
	 * @param blobKey
	 *            the {@link BlobKey} of the tracked file
	 */
	public StaticFileItemStore(String key, String blobKey) {
		this.key = key;
		this.blobKey = blobKey;
		this.prefix = key.substring(0, key.indexOf('#'));
	}

	/**
	 * Get the datastore key.
	 * 
	 * @return the key
	 */
	public String getKey() {
		return key;
	}

	/**
	 * Get the BlobKey.
	 * 
	 * @return the BlobKey of the tracked BlobStore file
	 */
	public String getBlobKey() {
		return blobKey;
	}
	
	public static byte[] readBlob(BlobKey blobKey) throws BadReqException {
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
			} catch(FileNotFoundException e) {
				throw new BadReqException(String.format("File not found for blobKey: '%s'", blobKey), e);
			} catch (IOException e) {
				throw new BadReqException(String.format("Failed to read data for blobKey: '%s'", blobKey), e);
			} finally {
				if (readChannel != null) {
					try {
						readChannel.close();
					} catch (IOException e) {}
				}
			}
	}
	
	public static BlobKey writeBlob(String fileName, byte[] data) throws InternalServerException {
		try {
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
		} catch (Exception e) {
			throw new InternalServerException("Failed to write blobstore file", e);
		}
	}
	
	public static void deleteBlob(BlobKey blobKey) {
		BlobstoreServiceFactory.getBlobstoreService().delete(blobKey);
	}
	
	public static Reader getStaticFileReader(PersistenceManager pm, String prefix,
			String name, Locale locale, String suffix) throws BadReqException, InternalServerException {
		return new StringReader(readStaticFile(pm, prefix, name, locale, suffix));
	}
	
	public static String readStaticFile(PersistenceManager pm, String prefix,
			String name, Locale locale, String suffix) throws BadReqException, InternalServerException {
		String statStoreKey = prefix + "#" + name + "_" + locale.getLanguage() + suffix;
		if(staticFileCache.containsKey(statStoreKey)) {
			return staticFileCache.get(statStoreKey);
		} else {
			StaticFileItemStore item = pm.getObjectById(StaticFileItemStore.class, statStoreKey);
			byte[] data = readBlob(new BlobKey(item.getBlobKey()));
			try {
				String fileAsString = new String(data, "UTF-8");
				staticFileCache.put(statStoreKey, fileAsString);
				return fileAsString;
			} catch (UnsupportedEncodingException e) {
				throw new InternalServerException("UTF-8 not supported");
			}
		}
	}

	public static void clearStaticFileCache() {
		staticFileCache.clear();
	}
}
