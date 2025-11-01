import LoginForm from './LoginForm';

export default async function Page() {
  return (
    <div
      className="flex items-center justify-center h-full w-full"
      style={{
        minHeight: 'calc(100vh - 75px)',
        height: 'calc(100vh - 75px)',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <LoginForm />
    </div>
  );
}
