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
package org.daxplore.presenter.client.ui;

import org.daxplore.presenter.client.json.Settings;
import org.daxplore.presenter.shared.QuestionMetadata;

import com.google.gwt.user.client.ui.Composite;
import com.google.gwt.user.client.ui.HTML;
import com.google.inject.Inject;

public class DescriptionPanelBottom extends Composite {
	private QuestionMetadata questions;
	private HTML content = new HTML();
	
	@Inject
	public DescriptionPanelBottom(QuestionMetadata questions) {
		this.questions = questions;
		initWidget(content);
	}
	
	public void setDecription(String questionID, String perspectiveID) {
		String html = "";
		
		if (Settings.getQuestionDescriptionPosition() == Settings.DescriptionPosition.BOTTOM) {
			String questionDescription = questions.getDescriptionText(questionID);
			boolean questionEmpty = questionDescription == null || questionDescription.trim().isEmpty();
			if(!questionEmpty) {
				String title = questions.getShortText(questionID);
				html += "<b>" + title + "</b><p>"+questionDescription+"</p>";
			}
		}
		
		if (Settings.getPerspectiveDescriptionPosition() == Settings.DescriptionPosition.BOTTOM) {
			String perspectiveDescription = questions.getDescriptionText(perspectiveID);
			boolean perspectiveEmpty = perspectiveDescription == null || perspectiveDescription.trim().isEmpty();
			if(!perspectiveEmpty) {
				if(!html.isEmpty()) {
					html += "<hr>";
				}
				String title = questions.getShortText(perspectiveID);
				html += "<b>" + title + "</b><p>"+perspectiveDescription+"</p>";
			}
		}

		if(html.isEmpty()) {
			setVisible(false);
		} else {
			content.setHTML(html);
			content.setStylePrimaryName("daxplore-DescriptionPanelBottom");
			setVisible(true);
		}
	}
}
