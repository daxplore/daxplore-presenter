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

import org.daxplore.presenter.client.json.Perspectives;
import org.daxplore.presenter.client.resources.UITexts;
import org.daxplore.presenter.shared.PrefixProperties;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.event.logical.shared.HasSelectionHandlers;
import com.google.gwt.event.logical.shared.SelectionHandler;
import com.google.gwt.event.shared.HandlerRegistration;
import com.google.gwt.safehtml.shared.SafeHtmlBuilder;
import com.google.gwt.user.client.ui.FlowPanel;
import com.google.gwt.user.client.ui.HasHorizontalAlignment;
import com.google.gwt.user.client.ui.Label;
import com.google.gwt.user.client.ui.Tree;
import com.google.gwt.user.client.ui.TreeItem;
import com.google.inject.Inject;

/**
 * A widget that contains a list of questions that can be used as 
 * perspectives in a chart.
 * 
 * <p>
 * Used as a part of {@link PerspectivePanel}.
 * </p>
 */
public class PerspectiveQuestionsPanel extends FlowPanel implements HasSelectionHandlers<TreeItem> {

	protected Tree perspectiveList;

	/**
	 * A factory for creating PerspectiveQuestions objects.
	 */
	public static class PerspectiveQuestionsFactory {
		protected final QuestionMetadata questions;
		protected final Perspectives perspectives;
		protected final UITexts uiTexts;
		private final PrefixProperties prefixProperties;

		@Inject
		protected PerspectiveQuestionsFactory(QuestionMetadata questions, Perspectives perspectives,
				UITexts uiTexts, PrefixProperties prefixProperties) {
			this.questions = questions;
			this.perspectives = perspectives;
			this.uiTexts = uiTexts;
			this.prefixProperties = prefixProperties;
		}

		/**
		 * Creates a new PerspectiveQuestions object.
		 * 
		 * @return the perspective questions panel
		 */
		public PerspectiveQuestionsPanel createPerspectivePanel() {
			return new PerspectiveQuestionsPanel(questions, perspectives, uiTexts, prefixProperties);
		}
	}

	/**
	 * Get the currently selected perspective's questionID.
	 * 
	 * @return the question id
	 */
	public String getQuestionID() {
		QuestionTreeItem item = (QuestionTreeItem) perspectiveList.getSelectedItem();
		return item.getQuestionID();
	}
	
	protected PerspectiveQuestionsPanel(QuestionMetadata questions, Perspectives perspectives,
			UITexts uiTexts, PrefixProperties prefixProperties) {
		Label header = new Label(uiTexts.pickSelectionGroupHeader());
		header.setHorizontalAlignment(HasHorizontalAlignment.ALIGN_CENTER);
		header.addStyleName("daxplore-PerspectiveQuestionList-header");
		this.add(header);

		perspectiveList = new Tree();
		for (String questionID : perspectives.getQuestionIDs()) {
			SafeHtmlBuilder html = new SafeHtmlBuilder();
			html.appendEscaped(questions.getShortText(questionID));
			if(questions.hasSecondary(questionID)) {
				html.appendHtmlConstant("&nbsp;<span class=\"super\">");
				html.appendEscaped(prefixProperties.getSecondaryFlagText());
				html.appendHtmlConstant("</span>");
			}
			QuestionTreeItem item = new QuestionTreeItem(html.toSafeHtml(), questionID);
			perspectiveList.addItem(item);
		}
		setPerspective(perspectives.getQuestionIDs().get(0), false);
		this.add(perspectiveList);
		setWidth("100%");
	}

	protected void setPerspective(String questionID, boolean fireEvent) {
		for (int i = 0; i < perspectiveList.getItemCount(); i++) {
			QuestionTreeItem item = (QuestionTreeItem) perspectiveList.getItem(i);
			if (item.getQuestionID().equals(questionID)) {
				perspectiveList.setSelectedItem(item, fireEvent);
			}
		}
	}
	
	/**
	 * {@inheritDoc}
	 */
	public HandlerRegistration addSelectionHandler(SelectionHandler<TreeItem> handler) {
		return perspectiveList.addSelectionHandler(handler);
	}
}
