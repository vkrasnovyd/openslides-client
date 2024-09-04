import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserExport } from 'src/app/domain/models/users/user.export';
import { CsvColumnDefinitionProperty, CsvColumnsDefinition } from 'src/app/gateways/export/csv-export.service';
import { ViewMeeting } from 'src/app/site/pages/meetings/view-models/view-meeting';
import { ViewUser } from 'src/app/site/pages/meetings/view-models/view-user';

import { MeetingCsvExportForBackendService } from '../../../../services/export/meeting-csv-export-for-backend.service';
import { participantColumns } from '../../pages/participant-import/definitions';
import { ParticipantExportModule } from '../participant-export.module';
import { participantsExportExample } from '../participants-export-example';

export interface ParticipantExport extends UserExport {
    comment?: string;
    is_present_in_meeting_ids?: string | boolean;
    group_ids?: string;
}

@Injectable({
    providedIn: ParticipantExportModule
})
export class ParticipantCsvExportService {
    // private _csvColumnDefinitionMapsMap: Map<string, CsvColumnDefinitionMap<ViewUser>> = new Map([
    //     [
    //         `group_ids`,
    //         {
    //             label: `Groups`,
    //             map: user =>
    //                 user
    //                     .groups()
    //                     .map(group => group.name)
    //                     .join(`,`)
    //         }
    //     ],
    //     [
    //         `is_present_in_meeting_ids`,
    //         {
    //             label: `Is present`,
    //             map: user => (user.isPresentInMeeting() ? `1` : ``)
    //         }
    //     ]
    // ]);

    public constructor(
        private csvExport: MeetingCsvExportForBackendService,
        private translate: TranslateService
    ) {}

    public export(participants: ViewUser[]): void {
        this.csvExport.export(
            participants,
            participantColumns.map(key => {
                return {
                    property: key
                } as CsvColumnDefinitionProperty<ViewUser>;
            }) as CsvColumnsDefinition<ViewUser>,
            this.translate.instant(`Participants`) + `.csv`
        );
    }

    /**
     * @param meeting
     * @returns participants csv-example with added 'groups' value:
     * - 2 custom group (not default or admin) names separated by comma by default
     * - 1 custom group name if meeting has only 1 custom group
     * - default group name if meeting has no custom groups
     */
    private addParticipantGroups(meeting: ViewMeeting): UserExport[] {
        const customGroupNames = meeting.groups.filter(group => {
            return !group.isAdminGroup && !group.isDefaultGroup;
        });
        let groupsToExport;

        switch (customGroupNames.length) {
            case 0:
                groupsToExport = meeting.default_group.name;
                break;
            case 1:
                groupsToExport = customGroupNames[0].name;
                break;
            default:
                groupsToExport = customGroupNames
                    .slice(0, 2)
                    .map(group => group.name)
                    .join(`, `);
        }

        const rows: UserExport[] = participantsExportExample;
        rows[0][`groups`] = groupsToExport;

        return rows;
    }

    public exportCsvExample(meeting: ViewMeeting): void {
        const rows: UserExport[] = this.addParticipantGroups(meeting);
        this.csvExport.dummyCSVExport<UserExport>(
            participantColumns,
            rows,
            `${this.translate.instant(`participants-example`)}.csv`
        );
    }
}
