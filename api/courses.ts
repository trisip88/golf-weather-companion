import { SINGAPORE_GOLF_COURSES, DEFAULT_COURSE } from '../src/data/courses';

export default function handler(req: any, res: any) {
  res.status(200).json({
    courses: SINGAPORE_GOLF_COURSES,
    defaultCourseId: DEFAULT_COURSE.id,
  });
}
