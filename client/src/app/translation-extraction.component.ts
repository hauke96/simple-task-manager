/**
 * Workaround for extraction of localize keys
 *
 * Currently Angular (v.9.1.9) does not support extraction of $localize strings.
 * But it is likely to be available in a future version.
 * Until then you can use this workaround.
 * As soon as Angular supports the extraction you can just remove this component.
 * cf. https://developapa.com/angular-localize/
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-translation-extraction',
    template: `
        <span i18n="@@WARN_AUTH_FAIL">Logout because authorization was not successful</span>
        <span i18n="@@ERROR_NOT_CREATE_PROJ">Could not create project</span>
        <span i18n="@@ERROR_LOAD_PROJECTS">Could not load projects</span>
        <span i18n="@@ERROR_LIVE_UPDATE">Could not initialize live-updates</span>
        <span i18n="@@ERROR_COULD_NOT_UPLOAD">Could not upload file '{{interp}}'</span>
        <span i18n="@@ERROR_PARSING_OSM_DATA">Error parsing loaded OSM data</span>
        <span i18n="@@ERROR_OVERPASS_NO_POLYGONS">No usable polygons have been found. Make sure the output format is set to \'out:xml\' and the result contains actual polygons.</span>
        <span i18n="@@ERROR_UNABLE_LOAD_URL">Unable to load data from remote URL</span>
        <span i18n="@@WARN_ALREADY_MEMBER">User '{{interp}}' is already a member of this project</span>
        <span i18n="@@ERROR_USER_ID">Could not load user ID for user '{{interp}}'</span>
        <span i18n="@@ERROR_UNABLE_LOAD_USER">Unable to load assigned user</span>
        <span i18n="@@ERROR_ASSIGN_USER">Could not assign user</span>
        <span i18n="@@ERROR_UNASSIGN_USER">Could not unassign user</span>
        <span i18n="@@ERROR_PROCESS_POINTS">Could not set process points</span>
        <span i18n="@@ERROR_OPEN_JOSM">Unable to open JOSM. Is it running?</span>
        <span i18n="@@ERROR_NOT_LOAD_PROJ">Could not load project '{{interp}}'</span>
        <span i18n="@@ERROR_ONT_DELETE_PROJ">Could not delete project</span>
        <span i18n="@@INFO_REMOVED_PROJ">Project removed successfully</span>
        <span i18n="@@ERROR_LEAVE_PROJ">Could not leave project</span>
        <span i18n="@@INFO_SUCCESS_UPDATE_PROJ">Successfully updated project</span>
        <span i18n="@@ERROR_UPDATE_PROJ_TITLE">Unable to update project title and/or description</span>
        <span i18n="@@WARN_PROJECT_REMOVED">The project '{{interp}}' has been removed</span>
        <span i18n="@@WARN_REMOVED_USER_PROJECT">You have been removed from project '{{interp}}'</span>
        <span i18n="@@ERROR_NOT_REMOVE_USER">Could not remove user</span>
        <span i18n="@@ERROR_NOT_INVITE_USER">Could not invite user{{interp}}</span>
		    <span i18n="@@TABS_TASKS">Tasks</span>
		    <span i18n="@@TABS_USERS">Users</span>
		    <span i18n="@@TABS_SETTINGS">Settings</span>
		    <span i18n="@@TABS_DRAW">Draw</span>
		    <span i18n="@@TABS_UPLOAD">Upload</span>
		    <span i18n="@@TABS_REMOTE">Remote</span>
		    <span i18n="@@TABS_REMOVE">Remove</span>
		    <span i18n="@@TASK_MAP_DONE">DONE</span>
		    <span i18n="@@TASK_YOU">you</span>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TranslationExtractionComponent {
  public interp: any;
}
