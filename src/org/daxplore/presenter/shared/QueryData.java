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
package org.daxplore.presenter.shared;

import java.util.List;

public class QueryData {
	private String questionID, perspectiveID;
	
	private boolean hasAddedFreqPrimary, hasAddedFreqSecondary;
	private List<int[]> freqPrimary, freqSecondary;
	private int[] freqPrimaryTotal, freqSecondaryTotal;
	
	private boolean hasAddedMeanPrimary, hasAddedMeanSecondary;
	private double[] meanPrimary, meanSecondary;
	private double meanPrimaryTotal, meanSecondaryTotal;
	private int[] meanPrimaryCount, meanSecondaryCount;
	
	public QueryData(String questionID, String perspectiveID) {
		this.questionID = questionID;
		this.perspectiveID = perspectiveID;
	}

	public void addFreqPrimary(List<int[]> freqPrimary, int[] freqPrimaryTotal) {
		this.freqPrimary = freqPrimary;
		this.freqPrimaryTotal = freqPrimaryTotal;
		hasAddedFreqPrimary = true;
	}

	public void addFreqSecondary(List<int[]> freqSecondary, int[] freqSecondaryTotal) {
		this.freqSecondary = freqSecondary;
		this.freqSecondaryTotal = freqSecondaryTotal;
		hasAddedFreqSecondary = true;
	}
	
	public void addMeanPrimary(double[] meanPrimary, double meanPrimaryTotal, int[] meanPrimaryCount) {
		this.meanPrimary = meanPrimary;
		this.meanPrimaryTotal = meanPrimaryTotal;
		this.meanPrimaryCount = meanPrimaryCount;
		hasAddedMeanPrimary = true;
	}
	
	public void addMeanSecondary(double[] meanSecondary, double meanSecondaryTotal, int[] meanSecondaryCount) {
		this.meanSecondary = meanSecondary;
		this.meanSecondaryTotal = meanSecondaryTotal;
		this.meanSecondaryCount = meanSecondaryCount;
		hasAddedMeanSecondary = true;
	}
	
	/* Question and perspective */
	
	public String getQuestionID() {
		return questionID;
	}
	
	public String getPerspectiveID() {
		return perspectiveID;
	}
	
	/* Frequency data */
	
	public boolean hasAddedFreqPrimary() {
		return hasAddedFreqPrimary;
	}
	
	public boolean hasAddedFreqSecondary() {
		return hasAddedFreqSecondary;
	}
	
	public boolean hasFreqPrimary(int perspectiveOption) {
		return freqPrimary != null && freqPrimary.get(perspectiveOption).length > 0;
	}

	public boolean hasFreqSecondary(int perspectiveOption) {
		return freqSecondary != null && freqSecondary.get(perspectiveOption).length > 0;
	}
	
	public int[] getFreqPrimary(int perspectiveOption) {
		return freqPrimary.get(perspectiveOption);
	}

	public int[] getFreqSecondary(int perspectiveOption) {
		return freqSecondary.get(perspectiveOption);
	}
	
	public boolean hasFreqPrimaryTotal() {
		return freqPrimaryTotal != null && freqPrimaryTotal.length > 0;
	}

	public boolean hasFreqSecondaryTotal() {
		return freqSecondaryTotal != null && freqSecondaryTotal.length > 0;
	}
	
	public int[] getFreqPrimaryTotal() {
		return freqPrimaryTotal;
	}

	public int[] getFreqSecondaryTotal() {
		return freqSecondaryTotal;
	}
	
	/* Mean data */
	
	public boolean hasAddedMeanPrimary() {
		return hasAddedMeanPrimary;
	}
	
	public boolean hasAddedMeanSecondary() {
		return hasAddedMeanSecondary;
	}
	
	public double getMeanPrimary(int perspectiveOption) {
		return meanPrimary[perspectiveOption];
	}

	public double getMeanSecondary(int perspectiveOption) {
		return meanSecondary[perspectiveOption];
	}

	public double getMeanPrimaryTotal() {
		return meanPrimaryTotal;
	}
	
	public double getMeanSecondaryTotal() {
		return meanSecondaryTotal;
	}
	
	public int getMeanPrimaryCount(int perspectiveOption) {
		return meanPrimaryCount[perspectiveOption];
	}

	public int getMeanSecondaryCount(int perspectiveOption) {
		return meanSecondaryCount[perspectiveOption];
	}
}
