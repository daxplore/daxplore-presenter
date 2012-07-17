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
package org.daxplore.presenter.client.ui;

import java.util.LinkedList;
import java.util.List;

import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QueryDefinition.QueryFlag;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.event.logical.shared.HasValueChangeHandlers;
import com.google.gwt.event.logical.shared.ValueChangeEvent;
import com.google.gwt.event.logical.shared.ValueChangeHandler;
import com.google.gwt.event.shared.HandlerRegistration;
import com.google.gwt.user.client.ui.CheckBox;
import com.google.gwt.user.client.ui.FlexTable;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.HTMLTable.CellFormatter;
import com.google.gwt.user.client.ui.HasHorizontalAlignment;
import com.google.gwt.user.client.ui.Label;
import com.google.inject.Inject;

/**
 * A widget that contains a number of checkboxes that are used to select which
 * perspective options to show in a chart.
 * 
 * <p>
 * Used as a part of {@link PerspectivePanel}.
 * </p>
 */
public class PerspectiveCheckboxPanel extends FlowPanel implements ValueChangeHandler<Boolean>,
		HasValueChangeHandlers<Boolean> {

	protected List<CheckBox> checkboxList = new LinkedList<CheckBox>();
	protected CheckBox total;
	protected final QuestionMetadata questions;

	protected boolean selectionChangedHandlersInitialized;
	
	protected CheckBox lastSelectedBox;

	/**
	 * A factory for creating new PerspectiveCheckboxPanels.
	 */
	public static class PerspectiveCheckboxPanelFactory {
		protected final QuestionMetadata questions;
		protected final UITexts uiTexts;

		@Inject
		protected PerspectiveCheckboxPanelFactory(QuestionMetadata questions, UITexts uiTexts) {
			this.questions = questions;
			this.uiTexts = uiTexts;
		}

		/**
		 * Creates a new PerspectiveCheckboxPanel from a specific questionID.
		 * 
		 * @param questionID
		 *            the question name
		 * @return the checkbox panel
		 */
		public PerspectiveCheckboxPanel createCheckboxPanel(String questionID) {
			return new PerspectiveCheckboxPanel(questions, uiTexts, questionID, new LinkedList<Integer>(), false);
		}

		/**
		 * Creates a new PerspectiveCheckboxPanel from a specific
		 * queryDefinition.
		 * 
		 * @param queryDefinition
		 *            the query definition
		 * @return the checkbox panel
		 */
		public PerspectiveCheckboxPanel createCheckboxPanel(QueryDefinition queryDefinition) {
			return new PerspectiveCheckboxPanel(questions, uiTexts, queryDefinition.getPerspectiveID(),
					queryDefinition.getUsedPerspectiveOptions(), queryDefinition.hasFlag(QueryFlag.TOTAL));
		}
	}

	protected PerspectiveCheckboxPanel(QuestionMetadata questions, UITexts uiTexts, String questionID, List<Integer> checked,
			boolean checkTotal) {
		this.questions = questions;

		Label header = new Label(uiTexts.pickSelectionAlternativesHeader());
		header.setHorizontalAlignment(HasHorizontalAlignment.ALIGN_CENTER);
		header.addStyleName("daxplore-PerspectiveCheckboxes-header");
		this.add(header);

		List<String> options = questions.getOptionTexts(questionID);

		FlexTable grid = new FlexTable();
		CellFormatter formatter = grid.getCellFormatter();

		for (int i = 0; i < options.size(); i++) {
			CheckBox chkbox = new CheckBox(options.get(i));
			chkbox.addValueChangeHandler(this);
			chkbox.setFormValue(String.valueOf(i));
			chkbox.setValue(checked.contains(i), false);
			if (!checkTotal && checked.size() == 0 && i < 4) {
				chkbox.setValue(true, false);
			}
			checkboxList.add(chkbox);
			if (options.size() <= 6) {
				formatter.setWordWrap(i % options.size(), i / options.size(), false);
				grid.setWidget(i % options.size(), i / options.size(), chkbox);
			} else {
				formatter.setWordWrap(i % 7, i / 7, false);
				grid.setWidget(i % 7, i / 7, chkbox);
			}
		}
		this.add(grid);

		total = new CheckBox(uiTexts.compareWithAll());
		total.addValueChangeHandler(this);
		total.setFormValue("all");
		total.setValue(checkTotal, false);
		this.add(total);

	}

	/**
	 * Get a list of the indexes of the selected perspective options.
	 * 
	 * @return the selected option indexes
	 */
	public List<Integer> getPerspectiveOptions() {
		List<Integer> altList = new LinkedList<Integer>();
		for (CheckBox c : checkboxList) {
			if (c.getValue()) {
				try {
					altList.add(java.lang.Integer.parseInt(c.getFormValue()));
				} catch (NumberFormatException e) {
					e.printStackTrace();
				}
			}
		}
		
		// In case nothing is selected, add the last de-selected checkbox
		if (altList.size() == 0) {
			altList.add(java.lang.Integer.parseInt(lastSelectedBox.getFormValue()));
		}
		return altList;
	}

	/**
	 * Is the "total" checkbox checked?.
	 * 
	 * @return true, if the total checkbox is set
	 */
	public boolean isTotalSet() {
		return total.getValue();
	}

	/**
	 * Get the number of checkboxes that are set.
	 * 
	 * @return number of checked boxes
	 */
	protected int getCheckedCount() {
		int count = 0;
		for (CheckBox c : checkboxList) {
			if (c.getValue()) {
				count++;
			}
		}
		if (total.getValue()) {
			count++;
		}
		return count;
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onValueChange(ValueChangeEvent<Boolean> event) {
		// Only send an update if an option is selected, otherwise the chart will crash
		if (getCheckedCount() > 0) {
			ValueChangeEvent.fire(this, event.getValue());
		} else if (event.getSource() instanceof CheckBox) {
			// If all checkboxes are unchecked, remember what checkbox was
			// last checked and treat this as the current state.
			lastSelectedBox = (CheckBox) event.getSource();
		} else {
			throw new Error("PerspectiveCheckboxPanel listening to incorrect ValueChangeEvents");
		}
	}

	/**
	 * {@inheritDoc}
	 */
	@Override
	public HandlerRegistration addValueChangeHandler(ValueChangeHandler<Boolean> handler) {
		return addHandler(handler, ValueChangeEvent.getType());
	}
}
