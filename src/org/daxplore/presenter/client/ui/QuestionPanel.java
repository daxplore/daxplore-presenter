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

import org.daxplore.presenter.client.event.QueryUpdateEvent;
import org.daxplore.presenter.client.event.QueryUpdateHandler;
import org.daxplore.presenter.client.event.SelectionUpdateEvent;
import org.daxplore.presenter.client.json.Groups;
import org.daxplore.presenter.shared.QueryDefinition;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.user.client.ui.Composite;
import com.google.inject.Inject;
import com.google.web.bindery.event.shared.EventBus;

/**
 * A widget that contains a tree of all the questions that can be shown
 * in a chart.
 * 
 * <p>The tree is made up from groups of questions, that the user can
 * select.</p>
 */
public class QuestionPanel extends Composite implements QueryUpdateHandler {
	
	private final EventBus eventBus;
	private String questionID;
	
	@Inject
	protected QuestionPanel(EventBus eventBus, Groups groups) {
		this.eventBus = eventBus;
		QueryUpdateEvent.register(eventBus, this);
		exportQuestionCallback();

		questionID = groups.getQuestionIDs(0).get(0);
		
//		treeRoot = new Tree(uiResources, false);
//		
//		Label header = new Label(uiTexts.pickAQuestionHeader());
//		header.addStyleName("daxplore-QuestionPanel-header");
//		vp.add(header);
//		vp.setCellHeight(header, "30px");
//
//		// Set up questiontree
//
//		treeRoot.addSelectionHandler(new QuestionSelectionHandler());
//		treeRoot.addOpenHandler(new GroupOpenHandler());
//		
//		for (int i = 0; i < groups.getGroupCount(); i++) {
//			String txt = groups.getGroupName(i);
//			Groups.Type type = groups.getGroupType(i);
//			SafeHtmlBuilder html = new SafeHtmlBuilder();
//
//			switch(type) {
//			case GROUP:
//				html.appendHtmlConstant("<span class=\"daxplore-QuestionPanel-branch\">&nbsp;");
//				html.appendEscaped(txt);
//				html.appendHtmlConstant("&nbsp;</span>");
//				GroupItem gr = new GroupItem(html.toSafeHtml());
//				List<String> qlist = groups.getQuestionIDs(i);
//				for (String q : qlist) {
//					html = new SafeHtmlBuilder();
//					html.appendHtmlConstant("&nbsp;");
//					html.appendEscaped(questions.getShortText(q));
//					if(questions.hasSecondary(q)) {
//						html.appendHtmlConstant("&nbsp;<span class=\"super\">");
//						html.appendEscaped(uiTexts.secondaryFlag());
//						html.appendHtmlConstant("</span>");
//					}
//					html.appendHtmlConstant("&nbsp;");
//					QuestionTreeItem qi = new QuestionTreeItem(html.toSafeHtml(), q);
//					qi.setTitle(questions.getFullText(q));
//					gr.addItem(qi);
//				}
//				treeRoot.addItem(gr);
//				break;
//			case HEADER:
//				html.appendHtmlConstant("<span class=\"daxplore-QuestionPanel-subheader\">&nbsp;");
//				html.appendEscaped(txt);
//				html.appendHtmlConstant("&nbsp;</span>");
//				TreeItem item = new HeaderItem(html.toSafeHtml());
//				treeRoot.addItem(item);
//				break;
//			default:
//				break;
//			}
//		}
//
//		vp.add(treeRoot);
//		vp.setCellVerticalAlignment(treeRoot, HasVerticalAlignment.ALIGN_TOP);
//		vp.setWidth("100%");
//		initWidget(vp);
	}
	
	/**
	 * Get the questionID of the currently selected question.
	 * 
	 * @return the questionID
	 */
	public String getQuestionID() {
		return questionID;
	}
	
	/**
	 * {@inheritDoc}
	 */
	@Override
	public void onQueryUpdate(QueryUpdateEvent event) {
		setQueryDefinition(event.getQueryDefinition());
	}

	/**
	 * Set a new query definition, updating which group is open and
	 * what question is selected.
	 * 
	 * @param queryDefinition
	 *            the new query definition
	 */
	public void setQueryDefinition(QueryDefinition queryDefinition) {
		questionID = queryDefinition.getQuestionID();
		setQueryDefinitionNative(questionID);
	}
	
	protected native void setQueryDefinitionNative(String questionID) /*-{
		$wnd.questionSetQueryDefinition(questionID);
	}-*/;

	protected void gwtQuestionCallback(String question) {
		this.questionID = question;
		
		eventBus.fireEvent(new SelectionUpdateEvent());
	}
	
	protected native void exportQuestionCallback() /*-{
		var that = this;
		$wnd.gwtQuestionCallback = $entry(function(question) {
			that.@org.daxplore.presenter.client.ui.QuestionPanel::gwtQuestionCallback(Ljava/lang/String;)(question);
		});
	}-*/;
}
